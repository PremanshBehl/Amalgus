const path = require("path");
const fs = require("fs");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const MATCH_PROMPT = `You are an expert in glass, construction materials, and building requirements.

A buyer will describe their requirement in natural language.

You are given:

1. A buyer query
2. A list of products (JSON)

Your task:

* Identify the TOP 5 most relevant products
* Assign a match score (0–100)
* Provide a short explanation (1–2 lines)

Matching should consider:

* thickness match
* use-case (office partitions, balcony, windows, etc.)
* size/dimensions
* safety (laminated, tempered, etc.)
* price sensitivity (budget-friendly vs premium)
* color/tint preferences

Be intelligent and practical like a real supplier.

Return ONLY valid JSON:
[
{
"product_name": "",
"score": 0,
"explanation": ""
}
]`;

function loadProducts() {
  const productsPath = path.join(__dirname, "..", "data", "products.json");
  const raw = fs.readFileSync(productsPath, "utf-8");
  const products = JSON.parse(raw);
  if (!Array.isArray(products)) throw new Error("products.json must be an array");
  return products;
}

function normalizeName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function extractThicknessMm(query) {
  const m = String(query || "").match(/(\d+(?:\.\d+)?)\s*mm\b/i);
  if (!m) return null;
  const v = Number(m[1]);
  return Number.isFinite(v) ? v : null;
}

function generateExplanation(product, query) {
  const q = String(query || "").toLowerCase();
  const reasons = [];

  if (product.thickness) {
    const thicknessText = String(product.thickness);
    const thicknessNeedle = thicknessText.replace(/mm/gi, "").trim().toLowerCase();
    if (thicknessNeedle && q.includes(thicknessNeedle)) {
      reasons.push(`matches required thickness (${product.thickness})`);
    }
  }

  if (product.category && q.includes(String(product.category).toLowerCase())) {
    reasons.push(`suitable for ${String(product.category).toLowerCase()} applications`);
  }

  if (product.color && q.includes(String(product.color).toLowerCase())) {
    reasons.push(`matches color preference (${product.color})`);
  }

  const description = String(product.description || "").toLowerCase();

  if (q.includes("balcony") && description.includes("balcony")) {
    reasons.push("ideal for balcony usage");
  }

  if (q.includes("office") && description.includes("office")) {
    reasons.push("fits office partition use-case");
  }

  if (q.includes("window") && description.includes("window")) {
    reasons.push("suitable for window installations");
  }

  if (reasons.length === 0) {
    return "Relevant based on overall requirement and product specifications.";
  }

  return `${reasons.join(", ")}.`;
}

function heuristicMatch(query, products) {
  const q = String(query || "").toLowerCase();
  const desiredThickness = extractThicknessMm(q);

  const categoryKeywords = [
    { key: "tempered", cats: ["tempered", "toughened", "heat strengthened"] },
    { key: "laminated", cats: ["laminated", "laminated glass"] },
    { key: "insulated", cats: ["insulated", "ig unit", "double glazed", "double glazing", "argon"] },
    { key: "float", cats: ["float"] },
    { key: "frosted", cats: ["frosted", "sandblasted", "etched"] },
    { key: "reflective", cats: ["reflective", "solar", "sun", "low-e", "low e"] },
  ];

  const colorKeywords = [
    { key: "clear", color: ["clear"] },
    { key: "green", color: ["green"] },
    { key: "gray", color: ["gray", "grey", "smoked", "smoke"] },
    { key: "bronze", color: ["bronze", "brass", "champagne"] },
    { key: "blue", color: ["blue"] },
  ];

  const safetyRequested =
    /\b(safety|secure|impact|balcony|balustrade|stair|stairs|fall|impact resistant)\b/i.test(q) ||
    /\b(tempered|toughened|laminated)\b/i.test(q);

  const premiumRequested = /\b(premium|high[-\s]?end|luxury|top quality|best)\b/i.test(q);
  const budgetRequested = /\b(budget|affordable|cheap|lowest price|economy)\b/i.test(q);

  const priceValues = products
    .map((p) => Number(p.price_per_sqm ?? p.price))
    .filter((n) => Number.isFinite(n));
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const priceRange = Math.max(1, maxPrice - minPrice);

  function scoreProduct(p) {
    let score = 10;

    // Thickness
    const productThickness = extractThicknessMm(p.thickness);
    if (desiredThickness && productThickness) {
      const diff = Math.abs(productThickness - desiredThickness);
      if (diff === 0) score += 40;
      else if (diff <= 1) score += 25;
      else if (diff <= 3) score += 10;
      else score += 2;
    }

    // Category / use-case
    const pCat = normalizeName(p.category);
    for (const item of categoryKeywords) {
      const found = item.cats.some((c) => q.includes(c));
      if (found && pCat.includes(item.key)) score += 25;
      if (found && item.key === "reflective" && /low-e|low e|solar|reflect/i.test(q) && /low-e|low e|solar|reflect/i.test(p.color + " " + p.category)) {
        score += 25;
      }
    }

    // Safety
    if (safetyRequested) {
      const cat = (p.category || "").toLowerCase();
      const n = (p.name || "").toLowerCase();
      const isSafe = /laminat/.test(cat + " " + n) || /temper/.test(cat + " " + n) || /tough/.test(cat + " " + n);
      score += isSafe ? 20 : 0;
    }

    // Color
    for (const ck of colorKeywords) {
      const wants = ck.color.some((c) => q.includes(c));
      if (wants) {
        const prodColor = normalizeName(p.color);
        if (prodColor.includes(ck.key)) score += 10;
      }
    }

    // Size
    const size = String(p.size || "").toLowerCase();
    const qDigits = q.match(/(\d{3,4})\s*(?:mm)?\s*(?:x|×)\s*(\d{3,4})\s*(?:mm)?/i);
    if (qDigits) {
      const a = qDigits[1];
      const b = qDigits[2];
      if (size.includes(a.toLowerCase()) && size.includes(b.toLowerCase())) score += 10;
    }

    // Price sensitivity
    const price = Number(p.price_per_sqm ?? p.price);
    if (Number.isFinite(price) && minPrice !== maxPrice) {
      const norm = (maxPrice - price) / priceRange; // higher for cheaper
      if (budgetRequested) score += 15 * norm;
      if (premiumRequested) score += 15 * (1 - norm);
    }

    return clamp(Math.round(score), 0, 100);
  }

  return products
    .map((p) => ({
      product_name: p.name,
      score: scoreProduct(p),
      explanation: generateExplanation(p, query),
      product: p,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

async function llmMatch(query, products) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });

  const messages = [
    { role: "system", content: MATCH_PROMPT },
    {
      role: "user",
      content: `Buyer query:\n${query}\n\nProducts:\n${JSON.stringify(products)}`,
    },
  ];

  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages,
    temperature: 0,
    max_tokens: 900,
  });

  const text = completion.choices?.[0]?.message?.content || "";
  const parsed = (() => {
    try {
      return JSON.parse(text);
    } catch {
      // Try to recover from surrounding text by extracting the first JSON array.
      const start = text.indexOf("[");
      const end = text.lastIndexOf("]");
      if (start === -1 || end === -1 || end <= start) throw new Error("No JSON array found in model output.");
      const candidate = text.slice(start, end + 1);
      return JSON.parse(candidate);
    }
  })();

  if (!Array.isArray(parsed)) throw new Error("LLM did not return an array");

  const nameToProduct = new Map();
  for (const p of products) nameToProduct.set(normalizeName(p.name), p);

  const matches = parsed
    .map((item) => {
      const productName = String(item.product_name || "");
      const score = Number(item.score);
      const explanation = String(item.explanation || "");
      const product = nameToProduct.get(normalizeName(productName)) || null;
      return {
        product_name: productName || product?.name || null,
        score: Number.isFinite(score) ? clamp(Math.round(score), 0, 100) : 0,
        explanation: explanation || generateExplanation(product, query),
        product,
      };
    })
    .filter((m) => m.product); // keep only items we can enrich

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const products = loadProducts();

app.get("/health", (_req, res) => {
  res.json({ ok: true, products: products.length });
});

app.get("/products", (_req, res) => {
  res.json({ products });
});

app.post("/match", async (req, res) => {
  try {
    const query = req.body?.query;
    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ error: "Body must be { query: string }" });
    }

    const llmResults = await llmMatch(query, products);
    if (llmResults && llmResults.length) {
      return res.json({
        matches: llmResults.map((m) => ({
          product_name: m.product_name,
          score: m.score,
          explanation: m.explanation,
          product: {
            id: m.product.id,
            name: m.product.name,
            category: m.product.category,
            thickness: m.product.thickness,
            size: m.product.size,
            color: m.product.color,
            edge_finish: m.product.edge_finish,
            certification: m.product.certification,
            supplier: m.product.supplier,
            price_per_sqm: m.product.price_per_sqm ?? m.product.price,
            description: m.product.description,
          },
        })),
        source: process.env.OPENAI_API_KEY ? "llm" : "heuristic",
      });
    }

    // Fallback: keep prototype runnable without an API key.
    const heuristic = heuristicMatch(query, products);
    return res.json({ matches: heuristic, source: "heuristic" });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || "Unexpected error",
    });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`);
});

