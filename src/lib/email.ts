import { Resend } from "resend";
import type { Listing } from "@/lib/types";

// Resend klijent. Ključ se čita iz env (RESEND_API_KEY). Ako nije postavljen,
// slanje je no-op (lokalni dev bez ključa ne puca).
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM ?? "Vozila.hr <alarm@vozila.hr>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://auti-hr.vercel.app";

export function isEmailConfigured(): boolean {
  return resend !== null;
}

type AlertEmailInput = {
  to: string;
  firstName: string;
  searchName: string;
  newCount: number;
  listings: Listing[]; // najnoviji oglasi za prikaz u emailu (max ~5)
  searchUrl: string; // link natrag na rezultate
};

/**
 * Pošalji email obavijest o novim oglasima za spremljenu pretragu.
 * Vraća { sent: boolean } — false ako Resend nije konfiguriran.
 */
export async function sendSavedSearchAlert(input: AlertEmailInput): Promise<{ sent: boolean; error?: string }> {
  if (!resend) return { sent: false, error: "RESEND_API_KEY nije postavljen" };

  const subject =
    input.newCount === 1
      ? `Novi oglas za "${input.searchName}"`
      : `${input.newCount} novih oglasa za "${input.searchName}"`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject,
      html: renderAlertHtml(input),
    });
    if (error) return { sent: false, error: String(error) };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "Greška pri slanju" };
  }
}

function renderAlertHtml(input: AlertEmailInput): string {
  const ink = "#0f1115";
  const accent = "#e8742c";
  const line = "#e6e3dd";
  const muted = "#6b6b6b";

  const cards = input.listings
    .slice(0, 5)
    .map((l) => {
      const img = l.images?.[0] ?? "";
      const price = l.priceEur.toLocaleString("hr-HR");
      const url = `${SITE_URL}/oglasi/${l.slug}`;
      return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${line};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="120" valign="top">
                ${img ? `<img src="${img}" width="120" height="80" alt="" style="border-radius:8px;object-fit:cover;display:block;" />` : ""}
              </td>
              <td valign="top" style="padding-left:14px;font-family:Arial,Helvetica,sans-serif;">
                <a href="${url}" style="color:${ink};font-size:15px;font-weight:bold;text-decoration:none;">${escapeHtml(l.title)}</a>
                <div style="color:${muted};font-size:13px;margin-top:4px;">
                  ${l.year}. · ${l.km.toLocaleString("hr-HR")} km · ${escapeHtml(l.fuel)}${l.city ? ` · ${escapeHtml(l.city)}` : ""}
                </div>
                <div style="color:${accent};font-size:16px;font-weight:bold;margin-top:6px;">${price} €</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="hr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f7f6f3;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f3;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${line};">
        <tr>
          <td style="background:${ink};padding:20px 28px;">
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:#ffffff;">VOZILA</span><span style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:${accent};">.HR</span>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;font-family:Arial,Helvetica,sans-serif;">
            <p style="margin:0 0 4px;color:${ink};font-size:18px;font-weight:bold;">Bok ${escapeHtml(input.firstName) || "korisniče"},</p>
            <p style="margin:0 0 20px;color:${muted};font-size:14px;line-height:1.5;">
              Pronašli smo <strong style="color:${ink};">${input.newCount} ${input.newCount === 1 ? "novi oglas" : "novih oglasa"}</strong> za tvoju spremljenu pretragu <strong style="color:${ink};">"${escapeHtml(input.searchName)}"</strong>.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cards}</table>
            <div style="text-align:center;margin-top:24px;">
              <a href="${input.searchUrl}" style="display:inline-block;background:${ink};color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:8px;">Pogledaj sve rezultate</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px;border-top:1px solid ${line};font-family:Arial,Helvetica,sans-serif;">
            <p style="margin:0;color:${muted};font-size:12px;line-height:1.5;">
              Primaš ovaj email jer si uključio obavijesti za spremljenu pretragu na Vozila.hr.
              Obavijesti možeš isključiti u <a href="${SITE_URL}/moj-racun/pretrage" style="color:${muted};">Moj račun → Pretrage</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
