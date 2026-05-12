import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { GestorLayoutClient } from "@/components/gestor/gestor-layout-client";
import { getSiteConfigServer } from "@/lib/site-config-server";

export default async function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const siteConfig = await getSiteConfigServer();

  return (
    <GestorLayoutClient
      session={session}
      brand={{
        companyName: siteConfig.companyName,
        logoUrl: siteConfig.logoUrl,
      }}
    >
      {children}
    </GestorLayoutClient>
  );
}
