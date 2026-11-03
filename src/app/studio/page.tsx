import Link from "next/link";
import { getDict } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";
import { COSTS } from "@/lib/credits";
import { Studio } from "@/components/Studio";

export default async function StudioPage() {
  const { locale, t } = await getDict();
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="card mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">{t.studio.title}</h1>
        <p className="text-muted">{t.studio.loginFirst}</p>
        <div className="flex justify-center gap-3">
          <Link href="/login?next=/studio" className="btn-ghost">{t.nav.login}</Link>
          <Link href="/register" className="btn-primary">{t.nav.register}</Link>
        </div>
      </div>
    );
  }

  return <Studio locale={locale} costs={{ analyze: COSTS.analyze, generate: COSTS.generate }} />;
}
