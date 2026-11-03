import Link from "next/link";
import { getDict } from "@/lib/locale";
import { MONK_SCALE } from "@/lib/styles";

export default async function Home() {
  const { t } = await getDict();
  return (
    <div className="space-y-14">
      <section className="grid items-center gap-10 py-8 md:grid-cols-2">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">{t.home.title}</h1>
          <p className="text-lg text-muted">{t.home.subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/studio" className="btn-primary !px-7 !py-3 !text-base">{t.home.cta}</Link>
            <Link href="/pricing" className="btn-ghost !px-7 !py-3 !text-base">{t.home.ctaPricing}</Link>
          </div>
          <p className="text-xs text-muted">🔒 {t.home.privacy}</p>
        </div>
        <div className="card flex flex-col items-center gap-5 py-10">
          <div className="flex gap-2" aria-hidden>
            {MONK_SCALE.map((c) => (
              <span key={c} className="h-16 w-6 rounded-t-full border border-black/5" style={{ background: c }} />
            ))}
          </div>
          <div className="flex gap-2" aria-hidden>
            {["#8c2f4f", "#c9a227", "#1f3a5f", "#2f4f3a", "#e8b4b8", "#111111", "#b5523b", "#d8c3a5", "#5b2a86", "#f2d0c4"].map((c) => (
              <span key={c} className="h-10 w-6 rounded-t-full shadow-inner" style={{ background: c }} />
            ))}
          </div>
          <p className="text-center text-sm text-muted">Monk Skin Tone 1–10</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.home.features.map((f) => (
          <div key={f.t} className="card space-y-2">
            <h2 className="font-semibold">{f.t}</h2>
            <p className="text-sm text-muted">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
