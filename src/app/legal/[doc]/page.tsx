import { notFound } from "next/navigation";
import { getDict } from "@/lib/locale";
import { env } from "@/lib/env";
import { LEGAL_DOCS, legalContent, type LegalDoc } from "@/lib/legal";

const UPDATED = "2026-11-03";

export default async function LegalPage(props: PageProps<"/legal/[doc]">) {
  const { doc } = await props.params;
  if (!(LEGAL_DOCS as readonly string[]).includes(doc)) notFound();
  const { locale, t } = await getDict();
  const page = legalContent(doc as LegalDoc, locale, {
    brand: t.brand,
    operator: env.operatorName,
    email: env.supportEmail,
    updated: UPDATED,
  });

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">{page.title}</h1>
        <p className="text-sm text-muted">{t.legal.updated}: {UPDATED}</p>
      </header>
      {page.sections.map((s) => (
        <section key={s.h} className="space-y-2">
          <h2 className="text-lg font-semibold">{s.h}</h2>
          {s.p.map((p) => (
            <p key={p} className="leading-relaxed text-muted">{p}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
