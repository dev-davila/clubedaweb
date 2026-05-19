export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { WizardShell } from "@/components/gestor/wizard/wizard-shell";

export default async function WizardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/gestor/login");
  return <WizardShell />;
}
