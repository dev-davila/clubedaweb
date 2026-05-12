import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aprovacao de Cronicas | M3Solutions",
  description: "Pagina de aprovacao de cronicas M3Solutions",
  robots: "noindex, nofollow"
};

export default function CronicasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
