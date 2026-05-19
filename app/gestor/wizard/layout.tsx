// Bypass o layout do gestor (sidebar) — wizard é fullscreen
export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
