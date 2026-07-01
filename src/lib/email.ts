const RESEND_API_KEY = import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY ?? "";
const FROM = "Meridian Coffee <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
  } catch {
    // best-effort — never block the user-facing flow on email delivery
  }
}

export async function sendSignupAck({ to }: { to: string }) {
  await sendEmail(
    to,
    "You're on the Meridian list",
    `<div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #1c1a16;">
      <h1 style="font-size: 24px; margin-bottom: 12px;">You're on the list.</h1>
      <p style="font-size: 15px; line-height: 1.6; color: #6b6457;">
        Thanks for signing up for Meridian's early access. We'll email you first with launch details,
        founding-member pricing, and our debut roast drop. No spam — just the essentials.
      </p>
      <p style="font-size: 15px; margin-top: 24px;">— The Meridian team</p>
    </div>`
  );
}
