import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDict } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export default async function AccountPage(props: PageProps<"/account">) {
  const { t } = await getDict();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const { checkout } = await props.searchParams;

  const items = await db
    .select({ id: schema.generations.id, title: schema.generations.title, createdAt: schema.generations.createdAt })
    .from(schema.generations)
    .where(eq(schema.generations.userId, user.id))
    .orderBy(desc(schema.generations.createdAt))
    .limit(60);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">{t.account.title}</h1>
      {checkout === "success" && <p className="card border-green-600/40 text-sm">✅ {t.account.success}</p>}
      <div className="card flex flex-wrap items-center gap-4">
        <div className="mr-auto">
          <p className="text-sm text-muted">{user.email}</p>
          <p className="text-sm text-muted">{t.account.balance}</p>
          <p className="text-3xl font-semibold">{user.credits}</p>
        </div>
        <Link href="/pricing" className="btn-primary">{t.account.buyMore}</Link>
        <Link href="/studio" className="btn-ghost">{t.nav.studio}</Link>
      </div>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.account.history}</h2>
        {items.length === 0 ? (
          <p className="text-muted">{t.account.empty}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {items.map((g) => (
              <a key={g.id} href={`/api/images/${g.id}`} target="_blank" className="card !p-2 space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/images/${g.id}`} alt={g.title} className="aspect-square w-full rounded-xl object-cover" loading="lazy" />
                <p className="truncate px-1 text-sm">{g.title}</p>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
