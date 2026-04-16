import { useEffect, useMemo, useState } from "react";

function formatMoneyPerSqm(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  // Industry pricing is usually "per sqm"; keep it clean for the demo.
  return `$${Math.round(n).toLocaleString()}`;
}

function SearchIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10.5 18.5C14.365 18.5 17.5 15.365 17.5 11.5C17.5 7.63501 14.365 4.5 10.5 4.5C6.63501 4.5 3.5 7.63501 3.5 11.5C3.5 15.365 6.63501 18.5 10.5 18.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 20.5L16.9 16.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2.75C17.109 2.75 21.25 6.891 21.25 12C21.25 17.109 17.109 21.25 12 21.25C6.891 21.25 2.75 17.109 2.75 12C2.75 6.891 6.891 2.75 12 2.75Z"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />
      <path
        d="M21.25 12C21.25 7.865 18.2 4.4 14.2 3.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function scoreBadgeClass(score) {
  if (score >= 85) return "bg-emerald-600";
  if (score >= 70) return "bg-lime-600";
  if (score >= 50) return "bg-yellow-500";
  return "bg-slate-500";
}

export default function App() {
  const API_URL = useMemo(
    () => import.meta.env.VITE_API_URL || "http://localhost:3001",
    []
  );

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then((data) => setAllProducts(Array.isArray(data?.products) ? data.products : []))
      .catch(() => {});
  }, [API_URL]);

  async function onFindMatches() {
    const trimmed = query.trim();
    if (!trimmed) {
      setError("Please describe your requirement.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const resp = await fetch(`${API_URL}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.error || resp.statusText);
      }

      const data = await resp.json();
      setResults(Array.isArray(data?.matches) ? data.matches : []);
    } catch (e) {
      setError(e?.message || "Failed to find matches.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white text-slate-900">
      {/* Navbar */}
      <div className="sticky top-0 z-40">
        <div className="border-b border-slate-200/60 bg-white/70 backdrop-blur">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm">
                <span className="text-sm font-black">A</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold tracking-wide">Amalgus</div>
                <div className="text-xs text-slate-600">
                  AI-Powered Glass & Materials Marketplace
                </div>
              </div>
            </div>

            <nav className="hidden items-center gap-6 md:flex">
              <a
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
                href="#products"
              >
                Products
              </a>
              <a
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
                href="#suppliers"
              >
                Suppliers
              </a>
              <a
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
                href="#about"
              >
                About
              </a>
            </nav>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-[1200px] px-6 pt-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_460px] lg:items-start">
          <div className="lg:pt-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              AI-matched specs • Faster supplier discovery
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Find the Perfect Glass Product in Seconds
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
              Describe your requirement and let AI match you with the best suppliers instantly.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-sm text-slate-600">
              <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-slate-200/70">
                Thickness-aware matching
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-slate-200/70">
                Safety + use-case ranking
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-slate-200/70">
                Explainable top matches
              </span>
            </div>
          </div>

          {/* Input card */}
          <div id="products">
            <div className="relative rounded-2xl border border-slate-200/70 bg-white/65 p-5 shadow-lg backdrop-blur">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/10 blur-2xl" />

              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      AI Requirement Search
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      AI-Powered Glass & Materials Discovery Platform
                    </div>
                  </div>
                  <div className="hidden rounded-xl bg-slate-50 px-3 py-2 text-right text-xs ring-1 ring-slate-200/60 sm:block">
                    <div className="font-semibold text-slate-800">Top 5 matches</div>
                    <div className="text-slate-500">
                      with explainability
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-slate-700">
                    Your requirement
                  </label>

                  {/* Premium textarea search field */}
                  <div className="mt-2 flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm focus-within:ring-2 focus-within:ring-emerald-400">
                    <div className="mt-0.5 text-emerald-700">
                      <SearchIcon className="h-5 w-5" />
                    </div>
                    <textarea
                      className="w-full resize-y bg-transparent text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      style={{ minHeight: 120 }}
                      placeholder="e.g. Laminated safety glass for an office partition, 10mm, clear, polished edges, 3210mm x 2134mm. | e.g. Tempered green glass for balcony glazing, 10mm, polished edges, glare reduction."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>

                  {error ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={onFindMatches}
                    disabled={loading}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Spinner className="h-5 w-5 animate-spin text-white" />
                        <span className="sr-only">Analyzing your requirement</span>
                      </>
                    ) : (
                      <span>Find Best Matches</span>
                    )}
                  </button>

                  <div className="mt-3 text-xs text-slate-500">
                    Tip: include thickness (mm), safety type (tempered/laminated), color/tint, and approximate dimensions.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <section className="mt-12 pb-10" id="suppliers">
          {loading ? (
            <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <Spinner className="h-6 w-6 animate-spin text-emerald-700" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Analyzing your requirement...
                  </div>
                  <div className="text-xs text-slate-600">
                    Matching thickness, safety, dimensions, and price sensitivity.
                  </div>
                </div>
              </div>
            </div>
          ) : results.length ? (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Recommended Matches
                  </div>
                  <div className="text-xs text-slate-600">
                    Top products ranked by semantic fit.
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Showing {results.length} results
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {results.map((r) => {
                  const score = Number(r?.score) || 0;
                  const product = r?.product;

                  return (
                    <article
                      key={`${product?.id || r.product_name || "unknown"}-${score}`}
                      className="group rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate text-base font-bold text-slate-900">
                            {product?.name || r.product_name || "Unknown product"}
                          </div>
                          <div className="mt-1 text-xs font-medium text-slate-500">
                            {product?.category || "—"}
                          </div>
                        </div>

                        {/* Score badge */}
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold text-white ${scoreBadgeClass(
                            score
                          )}`}
                          title="Match score (0-100)"
                        >
                          {score}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Thickness
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            {product?.thickness || "—"}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Size
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            {product?.size || "—"}
                          </div>
                        </div>
                      </div>

                      {/* Explanation highlighted box */}
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                          Why this match
                        </div>
                        <div className="mt-1 text-sm font-medium text-emerald-900">
                          {r.explanation}
                        </div>
                      </div>

                      {/* Supplier + price */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Supplier
                          </div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {product?.supplier || "—"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Price
                          </div>
                          <div className="mt-1 font-extrabold text-slate-900">
                            {formatMoneyPerSqm(product?.price_per_sqm)} / sqm
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : !query.trim() ? (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Explore All Products
                  </div>
                  <div className="text-xs text-slate-600">
                    Browse the catalog before running an AI-powered search.
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {allProducts.length} products
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {allProducts.map((p) => (
                  <article
                    key={p.id}
                    className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-slate-900">
                          {p.name}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {p.category}
                        </p>
                      </div>

                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        Catalog
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Thickness
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {p.thickness}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Size
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {p.size}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Supplier
                        </div>
                        <div className="mt-1 font-semibold text-slate-900">
                          {p.supplier}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Price
                        </div>
                        <div className="mt-1 font-extrabold text-slate-900">
                          {formatMoneyPerSqm(p.price_per_sqm ?? p.price)} / sqm
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-slate-600">
                      {p.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : query.trim() ? (
            <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur">
              <div className="text-sm font-semibold text-slate-900">
                No matches yet. Try describing your requirement.
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Add thickness (mm), safety type (tempered/laminated), color/tint, and approximate dimensions.
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur">
              <div className="text-sm font-semibold text-slate-900">
                Start by describing your glass project
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Paste your requirement above and click{" "}
                <span className="font-semibold">Find Best Matches</span>.
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer id="about" className="pb-6">
          <div className="border-t border-slate-200/70 pt-6 text-center text-xs text-slate-500">
            © 2026 Amalgus – Smart Glass Marketplace
          </div>
        </footer>
      </div>
    </div>
  );
}

