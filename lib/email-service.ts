import { db } from "@/lib/db";

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
};

/**
 * Universal Email Sender for Infomedia AMRS.
 * Supports:
 * 1. Resend HTTP API (HTTPS Port 443 - Bypass SMTP Firewalls)
 * 2. Brevo HTTP API (HTTPS Port 443 - Bypass SMTP Firewalls)
 * 3. Nodemailer SMTP (Fallback when outside corporate firewall)
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
}: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const recipients = Array.isArray(to) ? to : [to];
  const validRecipients = recipients.filter(Boolean);
  if (validRecipients.length === 0) {
    return { success: false, error: "No recipients specified" };
  }

  const configuredFrom = process.env.EMAIL_FROM || "Infomedia AMRS <notifications@monthly-reportfam.web.id>";
  const defaultFrom = from || configuredFrom;

  // -------------------------------------------------------------
  // 1. Resend HTTP API (HTTPS 443) — Recommended for Office Wi-Fi
  // -------------------------------------------------------------
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      console.log(`[EMAIL] 🚀 Sending via Resend HTTPS API to: ${validRecipients.join(", ")}`);
      
      const formattedFrom = defaultFrom.includes("<") ? defaultFrom : `Infomedia AMRS <${defaultFrom}>`;
      const sendResults = await Promise.allSettled(
        validRecipients.map(async (recipient) => {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: formattedFrom,
              to: recipient,
              subject,
              html,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(`Resend ${res.status}: ${data.message || JSON.stringify(data)}`);
          }
          return { recipient, id: data.id };
        })
      );

      let successCount = 0;
      let lastId = "";
      for (const result of sendResults) {
        if (result.status === "fulfilled") {
          successCount++;
          lastId = result.value.id;
          console.log(`[EMAIL] ✅ Email delivered to ${result.value.recipient} (ID: ${result.value.id})`);
        } else {
          console.warn(`[EMAIL] ⚠️ Warning for recipient:`, result.reason?.message || result.reason);
        }
      }

      if (successCount > 0) {
        return { success: true, messageId: lastId };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[EMAIL] ❌ Resend delivery error:`, msg);
      // Fall through to next provider if configured
    }
  }

  // -------------------------------------------------------------
  // 2. Brevo HTTP API (HTTPS 443) — Alternative for Office Wi-Fi
  // -------------------------------------------------------------
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    try {
      console.log(`[EMAIL] 🚀 Sending via Brevo HTTPS API to: ${validRecipients.join(", ")}`);
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: "Infomedia AMRS",
            email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_SMTP_USER || "noreply@infomedia.co.id",
          },
          to: validRecipients.map((email) => ({ email })),
          subject,
          htmlContent: html,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }

      console.log(`[EMAIL] ✅ Email successfully sent via Brevo HTTPS API! ID: ${data.messageId}`);
      return { success: true, messageId: data.messageId };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[EMAIL] ❌ Brevo delivery error:`, msg);
    }
  }

  // -------------------------------------------------------------
  // 3. Fallback: Nodemailer SMTP
  // -------------------------------------------------------------
  const smtpHost = process.env.EMAIL_SMTP_HOST;
  if (smtpHost) {
    try {
      console.log(`[EMAIL] 🚀 Sending via SMTP (${smtpHost}) to: ${validRecipients.join(", ")}`);
      const nodemailer = await import("nodemailer");
      const port = Number(process.env.EMAIL_SMTP_PORT ?? 587);
      const secure = port === 465;

      const transporter = nodemailer.default.createTransport({
        host: smtpHost,
        port,
        secure,
        auth: {
          user: process.env.EMAIL_SMTP_USER,
          pass: process.env.EMAIL_SMTP_PASS,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
        tls: {
          rejectUnauthorized: false,
        },
      });

      const info = await transporter.sendMail({
        from: defaultFrom,
        to: validRecipients.join(", "),
        subject,
        html,
      });

      console.log(`[EMAIL] ✅ Email successfully sent via SMTP! ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[EMAIL] ❌ SMTP delivery error:`, msg);
      return { success: false, error: msg };
    }
  }

  console.warn(`[EMAIL] ⚠️ No email delivery service configured in .env (Set RESEND_API_KEY, BREVO_API_KEY, or EMAIL_SMTP_HOST).`);
  return { success: false, error: "No email delivery provider configured" };
}

/**
 * Send Revision Requested Notification Email to Report Submitters and Site PICs
 */
export async function sendRevisionNotification(reportId: string, note: string): Promise<void> {
  try {
    const report = await db.monthlyReport.findUnique({
      where: { id: reportId },
      include: {
        submittedBy: { select: { email: true, name: true } },
        site: {
          include: {
            users: {
              include: { user: { select: { email: true, name: true, role: { select: { code: true } } } } },
            },
          },
        },
      },
    });

    if (!report) {
      console.warn(`[EMAIL] Report ${reportId} not found.`);
      return;
    }

    const emailSet = new Set<string>();

    // 1. Submitter email directly from report relation
    if (report.submittedBy?.email) {
      emailSet.add(report.submittedBy.email.trim().toLowerCase());
    }

    // 2. Fallback: find who submitted the report from ReportStatusLog if submittedBy is not linked
    if (emailSet.size === 0) {
      const submitLog = await db.reportStatusLog.findFirst({
        where: { reportId, toStatus: "SUBMITTED" },
        orderBy: { createdAt: "desc" },
        include: { actedBy: { select: { email: true } } },
      });
      if (submitLog?.actedBy?.email) {
        emailSet.add(submitLog.actedBy.email.trim().toLowerCase());
      }
    }

    // 3. Assigned PICs and SUPPORT engineers for this site
    for (const a of report.site.users) {
      const roleCode = a.user.role?.code;
      if ((roleCode === "PIC" || roleCode === "SUPPORT") && a.user.email) {
        emailSet.add(a.user.email.trim().toLowerCase());
      }
    }

    // 4. Fallback: any assigned user on this site
    if (emailSet.size === 0) {
      for (const a of report.site.users) {
        if (a.user.email) {
          emailSet.add(a.user.email.trim().toLowerCase());
        }
      }
    }

    // Filter valid email formats
    const recipientEmails = Array.from(emailSet).filter((email) =>
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    );
    console.log(`[EMAIL] 📨 Revision email recipients for ${report.site.name}:`, recipientEmails);

    if (recipientEmails.length === 0) {
      console.warn(`[EMAIL] ⚠️ No valid recipient email found for report ${reportId} (Site: ${report.site.name})`);
      return;
    }

    const siteName = report.site.name;
    const period = `${report.periodMonth}/${report.periodYear}`;
    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    await sendEmail({
      to: recipientEmails,
      subject: `[Revisi Diminta] Laporan ${siteName} — Periode ${period}`,
      html: `
        <div style="font-family:'Segoe UI',Roboto,-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px">
          <div style="background:#E31E2D;padding:20px 24px;border-radius:8px 8px 0 0;text-align:left">
            <h2 style="color:#ffffff;margin:0;font-size:18px;font-weight:700">📋 Laporan Memerlukan Revisi</h2>
            <p style="color:#ffe4e6;margin:4px 0 0;font-size:13px">Infomedia Asset Management Reporting System</p>
          </div>
          <div style="background:#ffffff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
            <p style="color:#334155;margin:0 0 12px;font-size:14px">Halo Tim PIC,</p>
            <p style="color:#334155;margin:0 0 16px;font-size:14px;line-height:1.5">
              Laporan bulanan untuk <strong>${siteName}</strong> periode <strong>${period}</strong> 
              telah direview oleh HQ Admin dan memerlukan perbaikan.
            </p>
            <div style="background:#fff1f2;border-left:4px solid #E31E2D;padding:14px 16px;margin:0 0 20px;border-radius:0 6px 6px 0">
              <strong style="color:#9f1239;display:block;margin-bottom:6px;font-size:13px">✏️ Catatan Revisi dari Admin:</strong>
              <p style="color:#881337;margin:0;white-space:pre-wrap;font-size:13px;line-height:1.4">${note || "Mohon periksa kembali kelengkapan data laporan."}</p>
            </div>
            <p style="color:#334155;margin:0 0 20px;font-size:14px">
              Silakan akses sistem pelaporan dan perbaiki data sesuai catatan di atas.
            </p>
            <div style="text-align:center;margin:28px 0">
              <a href="${appUrl}/reports/${reportId}" 
                 style="display:inline-block;background:#E31E2D;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;box-shadow:0 2px 4px rgba(227,30,45,0.2)">
                Buka Laporan & Edit
              </a>
            </div>
            <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0 16px"/>
            <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center">
              Pesan ini dikirim otomatis oleh Sistem AMRS Infomedia Nusantara.
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("[EMAIL] Failed to send revision notification:", err);
  }
}
