import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { GestorLayoutClient } from "@/components/gestor/gestor-layout-client";
import { getSiteConfigServer } from "@/lib/site-config-server";
import { getAdminThemeStyles } from "@/lib/stitch/admin-theme";

export const dynamic = "force-dynamic";

export default async function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const siteConfig = await getSiteConfigServer();
  const { css: themeCss, hasStitchTheme, fontUrl } = await getAdminThemeStyles();

  return (
    <>
      {hasStitchTheme && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          {fontUrl && <link rel="stylesheet" href={fontUrl} />}
          <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        </>
      )}
      <GestorLayoutClient
        session={session}
        brand={{
          companyName: siteConfig.companyName,
          logoUrl: siteConfig.logoUrl,
        }}
      >
        {children}
      </GestorLayoutClient>
    </>
  );
}
