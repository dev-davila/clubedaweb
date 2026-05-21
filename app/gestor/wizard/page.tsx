import { redirect } from "next/navigation";

export default function WizardLegacyRedirect() {
  // Wizard legado (multi-step form) removido — só modo IA (chat) é suportado.
  redirect("/gestor/wizard/chat");
}
