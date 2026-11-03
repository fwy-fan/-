"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { dictionaries, type Locale } from "@/lib/i18n";
import {
  LENGTHS,
  MONK_SCALE,
  OCCASIONS,
  REGIONS,
  STYLE_DIRECTIONS,
  type Preferences,
} from "@/lib/styles";
import type { Design, HandAnalysis } from "@/lib/ai/claude";

interface Render {
  id: string;
  imageUrl: string;
  design: Design;
}

export function Studio({
  locale,
  costs,
}: {
  locale: Locale;
  costs: { analyze: number; generate: number };
}) {
  const t = dictionaries[locale];
  const s = t.studio;
  const router = useRouter();

  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Omit<Preferences, "locale">>({
    styleDirection: "neutral",
    region: "GLOBAL",
    occasion: "everyday",
    length: "any",
    skinToneOverride: null,
  });
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState<HandAnalysis | null>(null);
  const [renders, setRenders] = useState<Render[]>([]);
  const [busy, setBusy] = useState<null | "analyze" | "generate">(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function buildForm() {
    const form = new FormData();
    form.set("photo", photo!);
    form.set("prefs", JSON.stringify({ ...prefs, locale }));
    form.set("description", description);
    return form;
  }

  async function handleError(res: Response) {
    const body = await res.json().catch(() => ({}));
    const msg = t.errors[body.error] ?? t.errors.generic;
    setError(body.detail ? `${msg} — ${body.detail}` : msg);
    if (body.error === "no_credits") router.push("/pricing");
  }

  async function analyze() {
    if (!photo) return setError(s.needPhoto);
    setBusy("analyze");
    setError(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: buildForm() });
      if (!res.ok) return await handleError(res);
      const body = await res.json();
      setAnalysis(body.analysis);
      router.refresh(); // update the credit badge
    } catch {
      setError(t.errors.generic);
    } finally {
      setBusy(null);
    }
  }

  async function generate(design: Design | null) {
    if (!photo) return setError(s.needPhoto);
    if (!design && description.trim().length < 2) return setError(s.needDescription);
    setBusy("generate");
    setError(null);
    try {
      const form = buildForm();
      form.set("mode", design ? "design" : "custom");
      if (design) form.set("design", JSON.stringify(design));
      const res = await fetch("/api/generate", { method: "POST", body: form });
      if (!res.ok) return await handleError(res);
      const body = await res.json();
      setRenders((r) => [{ id: body.id, imageUrl: body.imageUrl, design: body.design }, ...r]);
      router.refresh();
      document.getElementById("renders")?.scrollIntoView({ behavior: "smooth" });
    } catch {
      setError(t.errors.generic);
    } finally {
      setBusy(null);
    }
  }

  const select = <K extends keyof typeof prefs>(key: K, value: (typeof prefs)[K]) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">{s.title}</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Photo */}
        <section className="card space-y-4">
          <h2 className="font-semibold">{s.step1}</h2>
          <label className="flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-background hover:border-accent">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="btn-ghost">{s.choose}</span>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setPhoto(f);
                  setPreview(URL.createObjectURL(f));
                  setAnalysis(null);
                }
              }}
            />
          </label>
          <p className="text-xs text-muted">{s.uploadHint}</p>
          <p className="text-xs text-muted">🔒 {t.home.privacy}</p>
        </section>

        {/* Preferences */}
        <section className="card space-y-5">
          <h2 className="font-semibold">{s.step2}</h2>

          <div>
            <span className="label">{s.styleDirection}</span>
            <div className="flex flex-wrap gap-2">
              {STYLE_DIRECTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => select("styleDirection", d)}
                  className={`rounded-full border px-4 py-1.5 text-sm ${
                    prefs.styleDirection === d ? "border-accent bg-accent-soft text-accent" : "border-border"
                  }`}
                >
                  {s.styleOptions[d]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="region">{s.region}</label>
              <select id="region" className="field" value={prefs.region} onChange={(e) => select("region", e.target.value)}>
                {REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>{locale === "zh" ? r.zh : r.en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="occasion">{s.occasion}</label>
              <select id="occasion" className="field" value={prefs.occasion} onChange={(e) => select("occasion", e.target.value as Preferences["occasion"])}>
                {OCCASIONS.map((o) => (
                  <option key={o} value={o}>{s.occasionOptions[o]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="length">{s.length}</label>
              <select id="length" className="field" value={prefs.length} onChange={(e) => select("length", e.target.value as Preferences["length"])}>
                {LENGTHS.map((l) => (
                  <option key={l} value={l}>{s.lengthOptions[l]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="label">{s.skinTone}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => select("skinToneOverride", null)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  prefs.skinToneOverride === null ? "border-accent bg-accent-soft text-accent" : "border-border"
                }`}
              >
                {s.skinToneAuto}
              </button>
              {MONK_SCALE.map((hex, i) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={`Monk ${i + 1}`}
                  title={`Monk ${i + 1}`}
                  onClick={() => select("skinToneOverride", i + 1)}
                  className={`h-7 w-7 rounded-full border-2 ${
                    prefs.skinToneOverride === i + 1 ? "border-accent ring-2 ring-accent/40" : "border-black/10"
                  }`}
                  style={{ background: hex }}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">{s.skinToneHint}</p>
          </div>

          <div>
            <label className="label" htmlFor="desc">{s.step3}</label>
            <textarea
              id="desc"
              rows={3}
              maxLength={2000}
              className="field"
              placeholder={s.descriptionPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" disabled={!!busy} onClick={analyze}>
              ✨ {s.analyze(costs.analyze)}
            </button>
            <button type="button" className="btn-ghost" disabled={!!busy} onClick={() => generate(null)}>
              🎨 {s.generateCustom(costs.generate)}
            </button>
          </div>

          {busy && (
            <p className="flex items-center gap-2 text-sm text-muted" role="status">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              {busy === "analyze" ? s.analyzing : s.generating}
            </p>
          )}
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        </section>
      </div>

      {renders.length > 0 && (
        <section id="renders" className="space-y-4">
          <h2 className="text-xl font-semibold">{s.results}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {renders.map((r) => (
              <figure key={r.id} className="card !p-3 space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.imageUrl} alt={r.design.title} className="w-full rounded-xl" />
                <figcaption className="flex items-center justify-between gap-2 px-1">
                  <span className="font-medium">{r.design.title}</span>
                  <a href={r.imageUrl} download={`${r.design.title}.jpg`} className="text-sm text-accent hover:underline">
                    {s.download}
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {analysis && (
        <section className="space-y-5">
          <div className="card space-y-3">
            <h2 className="text-xl font-semibold">{s.analysisTitle}</h2>
            <p>{analysis.summary}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-2">
                {s.detectedTone}:
                <span className="inline-block h-5 w-5 rounded-full border border-black/10" style={{ background: MONK_SCALE[analysis.hand.monkSkinTone - 1] }} />
                Monk {analysis.hand.monkSkinTone}
              </span>
              <span>{s.undertone}: {s.undertones[analysis.hand.undertone]}</span>
              <span>{s.nailBed}: {analysis.hand.nailBedWidth} / {analysis.hand.nailBedLength}</span>
              <span>{s.fingers}: {analysis.hand.fingerShape}</span>
            </div>
            <p className="text-sm text-muted">{analysis.hand.nailCondition}</p>
          </div>

          <h2 className="text-xl font-semibold">{s.recommendations}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {analysis.recommendations.map((d, i) => (
              <article key={i} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{d.title}</h3>
                  <div className="flex shrink-0 gap-1">
                    {d.colors.map((c) => (
                      <span key={c.hex + c.name} title={`${c.name} ${c.hex}`} className="h-6 w-6 rounded-full border border-black/10" style={{ background: c.hex }} />
                    ))}
                  </div>
                </div>
                <p className="text-sm">{d.description}</p>
                <p className="rounded-xl bg-accent-soft p-3 text-sm">
                  <strong>{s.why}{locale === "zh" ? "：" : ": "}</strong>{d.whyItSuits}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  <span>{s.shape}: {d.nailShape}</span>·
                  <span>{s.finish}: {d.finish}</span>·
                  <span>{s.maintenance}: {s.maintenanceOptions[d.maintenance]}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {d.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-xs">#{tag}</span>
                  ))}
                </div>
                <button type="button" className="btn-primary mt-auto self-start" disabled={!!busy} onClick={() => generate(d)}>
                  {s.generateThis(costs.generate)}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
