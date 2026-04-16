import { useMemo, useState } from "react";

function formatMoneyPerSqm(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  // Industry pricing is usually "per sqm"; keep it clean for the demo.
  return `$${Math.round(n).toLocaleString()}`;
}

export default function App() {
  const API_URL = useMemo(
    () => import.meta.env.VITE_API_URL || "http://localhost:3001",
    []
  );

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-4xl p-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">
            Smart Glass Product Finder
          </h1>
          <p className="mt-2 text-slate-600">
            Describe what you need (thickness, safety type, color/tint, and
            approximate dimensions). We’ll return the best matches.
          </p>
        </header>

        <div className="mt-6">
          <label className="text-sm font-medium text-slate-700">
            Your requirement
          </label>
          <textarea
            className="mt-2 min-h-[140px] w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="Example: I need laminated glass for an office partition, 10mm, clear, polished edges, size around 3.2m x 2.1m."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button
            type="button"
            onClick={onFindMatches}
            disabled={loading}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Finding best matches..." : "Find Best Matches"}
          </button>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}
        </div>

        <section className="mt-6">
          {results.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((r) => {
                const score = Number(r?.score) || 0;
                const badgeClass =
                  score >= 85
                    ? "bg-emerald-600"
                    : score >= 70
                      ? "bg-lime-600"
                      : score >= 55
                        ? "bg-amber-500"
                        : "bg-slate-500";

                return (
                  <article
                    key={`${r.product?.id || r.product_name || "unknown"}-${score}`}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">
                          {r.product?.name || r.product_name || "Unknown product"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {r.product?.category || "—"}
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold text-white ${badgeClass}`}
                        title="Match score (0-100)"
                      >
                        {score}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-700">
                      {r.explanation}
                    </p>

                    <div className="mt-4 space-y-1 text-sm">
                      <div>
                        <span className="text-slate-500">Thickness:</span>{" "}
                        {r.product?.thickness || "—"}
                      </div>
                      <div>
                        <span className="text-slate-500">Size:</span>{" "}
                        {r.product?.size || "—"}
                      </div>
                      <div>
                        <span className="text-slate-500">Price:</span>{" "}
                        {formatMoneyPerSqm(r.product?.price_per_sqm)} / sqm
                      </div>
                      <div>
                        <span className="text-slate-500">Supplier:</span>{" "}
                        {r.product?.supplier || "—"}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : loading ? (
            <div className="text-sm text-slate-700">Finding best matches...</div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Enter a requirement and click <span className="font-semibold">Find Best Matches</span>.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

