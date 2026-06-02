import { AdminChartCard } from "@/components/admin/dashboard/AdminChartCard";
import { AdminMetricCard } from "@/components/admin/dashboard/AdminMetricCard";
import { getAdminOverview } from "@/services/admin-service";
import { getRecommendationAdminInsights } from "@/services/recommendation/recommendation-engine";

export default async function AdminAnalyticsPage() {
  const [overview, recommendations] = await Promise.all([getAdminOverview(), getRecommendationAdminInsights()]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.metrics.slice(4).map((metric, index) => (
          <AdminMetricCard index={index} key={metric.label} metric={metric} />
        ))}
      </div>

      <AdminChartCard />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Views intelligence", recommendations.views],
          ["Cliques intelligence", recommendations.clicks],
          ["CTR", `${recommendations.ctr}%`],
          ["Secoes ativas", recommendations.activeIntelligenceSections],
        ].map(([label, value]) => (
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-5" key={String(label)}>
            <p className="text-xs font-semibold uppercase text-white/38">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{String(value)}</p>
            <p className="mt-1 text-xs text-white/42">Intelligence Engine</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-cinema-cyan">Curadoria e consumo</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Recomendacoes em destaque</h2>
            </div>
            <span className="rounded-full border border-cinema-cyan/24 bg-cinema-cyan/8 px-3 py-1 text-sm font-semibold text-cinema-cyan">
              {recommendations.liveScoredContent} conteudos avaliados
            </span>
          </div>

          <div className="space-y-3">
            {recommendations.topRecommended.map((item) => (
              <div className="grid grid-cols-[52px_1fr_auto] items-center gap-3 rounded-lg border border-white/8 bg-black/24 p-3" key={item.movie.id}>
                <img alt="" className="size-12 rounded-md object-cover" src={item.movie.posterUrl} />
                <div>
                  <p className="font-semibold text-white">{item.movie.title}</p>
                  <p className="text-xs text-cinema-muted">{item.movie.genres.map((genre) => genre.name).join(" / ")}</p>
                </div>
                <span className="text-lg font-semibold text-cinema-cyan">{item.movie.rating.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
          <p className="text-sm font-semibold text-cinema-cyan">Audiencia</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Padroes de consumo</h2>
          <div className="mt-5 space-y-3">
            {recommendations.similarity.map((signal) => (
              <div className="rounded-lg border border-white/8 bg-black/24 p-4" key={signal.label}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{signal.label}</p>
                  <span className="text-cinema-cyan">{signal.score}%</span>
                </div>
                <p className="mt-2 text-sm text-cinema-muted">{signal.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
          <p className="text-sm font-semibold text-cinema-cyan">Performance</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Secoes com melhor CTR</h2>
          <div className="mt-5 space-y-3">
            {recommendations.sectionPerformance.length ? recommendations.sectionPerformance.map((section) => (
              <div className="rounded-lg border border-white/8 bg-black/24 p-4" key={section.sectionSlug}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{section.sectionSlug}</p>
                  <span className="text-cinema-cyan">{section.ctr}%</span>
                </div>
                <p className="mt-2 text-sm text-cinema-muted">{section.views} views / {section.clicks} cliques</p>
              </div>
            )) : (
              <p className="rounded-lg border border-dashed border-white/12 p-4 text-sm text-cinema-muted">Sem eventos de recomendacao registrados ainda.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
          <p className="text-sm font-semibold text-cinema-cyan">Cliques</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Conteudos mais clicados</h2>
          <div className="mt-5 space-y-3">
            {recommendations.topClicked.length ? recommendations.topClicked.map((item) => (
              <div className="grid grid-cols-[52px_1fr_auto] items-center gap-3 rounded-lg border border-white/8 bg-black/24 p-3" key={item.movie.id}>
                <img alt="" className="size-12 rounded-md object-cover" src={item.movie.posterUrl} />
                <div>
                  <p className="font-semibold text-white">{item.movie.title}</p>
                  <p className="text-xs text-cinema-muted">{item.movie.genres.map((genre) => genre.name).join(" / ")}</p>
                </div>
                <span className="text-lg font-semibold text-cinema-cyan">{item.clicks}</span>
              </div>
            )) : (
              <p className="rounded-lg border border-dashed border-white/12 p-4 text-sm text-cinema-muted">Sem cliques registrados ainda.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
