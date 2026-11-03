import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getDict } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { LogoutButton } from "@/components/LogoutButton";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.brand, description: t.home.subtitle };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, t } = await getDict();
  const user = await getCurrentUser();

  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
            <Link href="/" className="mr-auto text-lg font-semibold tracking-tight">
              💅 {t.brand}
            </Link>
            <Link href="/studio" className="text-sm hover:text-accent">{t.nav.studio}</Link>
            <Link href="/pricing" className="text-sm hover:text-accent">{t.nav.pricing}</Link>
            {user ? (
              <>
                <Link href="/account" className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
                  {t.credits(user.credits)}
                </Link>
                <LogoutButton label={t.nav.logout} />
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm hover:text-accent">{t.nav.login}</Link>
                <Link href="/register" className="btn-primary !py-1.5">{t.nav.register}</Link>
              </>
            )}
            <LanguageSwitch locale={locale} />
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="space-y-2 border-t border-border px-4 py-6 text-center text-xs text-muted">
          <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href="/legal/terms" className="hover:text-accent">{t.legal.terms}</Link>
            <Link href="/legal/privacy" className="hover:text-accent">{t.legal.privacy}</Link>
            <Link href="/legal/refund" className="hover:text-accent">{t.legal.refund}</Link>
            <a href={`mailto:${env.supportEmail}`} className="hover:text-accent">
              {t.legal.contact}: {env.supportEmail}
            </a>
          </p>
          <p>{t.footer}</p>
        </footer>
      </body>
    </html>
  );
}
