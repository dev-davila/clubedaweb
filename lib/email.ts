import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Fetch SMTP configuration from the database (SiteConfig with category 'smtp').
 * Falls back to environment variables if DB config is not set.
 */
async function getSmtpConfig(): Promise<SmtpConfig> {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: { category: "smtp" },
    });

    const map: Record<string, string> = {};
    configs.forEach((c) => {
      map[c.key] = c.value;
    });

    if (map.smtp_host && map.smtp_user && map.smtp_pass) {
      return {
        host: map.smtp_host,
        port: parseInt(map.smtp_port || "587", 10),
        user: map.smtp_user,
        pass: map.smtp_pass,
        from: map.smtp_from || map.smtp_user,
      };
    }
  } catch (err) {
    console.error("[email] Failed to load SMTP config from DB, using env:", err);
  }

  // Fallback to environment variables
  return {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "",
  };
}

/**
 * Create a nodemailer transporter using SMTP settings from the database.
 */
async function createTransporter() {
  const cfg = await getSmtpConfig();

  if (!cfg.host || !cfg.user || !cfg.pass) {
    throw new Error(
      "SMTP não configurado. Configure as credenciais em Configurações > SMTP."
    );
  }

  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Send an email using the SMTP configuration stored in the database.
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const cfg = await getSmtpConfig();
    const transporter = await createTransporter();

    const recipients = Array.isArray(options.to) ? options.to.join(", ") : options.to;

    const info = await transporter.sendMail({
      from: options.from
        ? `"M3Solutions" <${options.from}>`
        : `"M3Solutions" <${cfg.from}>`,
      to: recipients,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    console.log(`[email] Sent to ${recipients}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error("[email] Failed to send:", err);
    return { success: false, error: err.message || "Erro ao enviar email" };
  }
}

/**
 * Test SMTP connection with given or stored credentials.
 */
export async function testSmtpConnection(overrides?: Partial<SmtpConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    let cfg = await getSmtpConfig();
    if (overrides) {
      cfg = { ...cfg, ...overrides };
    }

    if (!cfg.host || !cfg.user || !cfg.pass) {
      return { success: false, error: "Credenciais SMTP incompletas" };
    }

    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.verify();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Falha na conexão SMTP" };
  }
}
