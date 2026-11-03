import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { getLocale } from "@/lib/locale";

export default async function Page() {
  const locale = await getLocale();
  return (
    <Suspense>
      <AuthForm locale={locale} mode="login" />
    </Suspense>
  );
}
