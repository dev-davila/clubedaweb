export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { WizardChatShell } from "@/components/gestor/wizard/chat-shell";

export default async function WizardChatPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/gestor/login");
  return <WizardChatShell />;
}
