import { env } from "../lib/env.js";
import { isMailerConfigured, transporter } from "../lib/mailer.js";
import logger from "../lib/logger.js";

export interface BookingEmailContext {
  bookingId: string;
  parentName: string;
  parentEmail: string;
  childAge?: number;
  mentorName: string;
  mentorEmail: string;
  startsAt: Date;
  endsAt: Date;
  meetingLink: string;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatSlot = (startsAt: Date, endsAt: Date): string => {
  const date = startsAt.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const start = startsAt.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const end = endsAt.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} • ${start} - ${end} IST`;
};

const baseTemplate = (
  title: string,
  intro: string,
  rows: string,
  ctaHref: string,
  ctaLabel: string,
): string => `
  <!DOCTYPE html>
  <html lang="en">
    <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="background-color:#4f46e5;padding:20px 28px;color:#ffffff;font-size:20px;font-weight:bold;">
                  ${escapeHtml(title)}
                </td>
              </tr>
              <tr>
                <td style="padding:28px;color:#1f2937;font-size:15px;line-height:1.6;">
                  <p>${escapeHtml(intro)}</p>
                  <table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="margin:16px 0;">
                    ${rows}
                  </table>
                  <p>Join the trial class using the meeting link below:</p>
                  <p style="text-align:center;margin:20px 0;">
                    <a href="${escapeHtml(ctaHref)}" target="_blank" style="background-color:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block;">
                      ${escapeHtml(ctaLabel)}
                    </a>
                  </p>
                  <p style="font-size:13px;color:#6b7280;">
                    If the button does not work, copy and paste this link into your browser:<br />
                    <span>${escapeHtml(ctaHref)}</span>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

const detailRow = (label: string, value: string): string => `
  <tr>
    <td style="color:#6b7280;font-weight:bold;white-space:nowrap;">${escapeHtml(label)}</td>
    <td style="padding-left:16px;">${escapeHtml(value)}</td>
  </tr>
`;

const sendMail = async (to: string, subject: string, html: string) => {
  const info = await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
  });

  if (!isMailerConfigured) {
    logger.info(
      {
        mailTo: to,
        subject,
        message: info.message,
      },
      "Booking email generated (SMTP not configured, email was not delivered)",
    );
  }

  return info;
};

export const sendParentBookingEmail = async (
  ctx: BookingEmailContext,
): Promise<void> => {
  const slot = formatSlot(ctx.startsAt, ctx.endsAt);
  const reason = ctx.childAge
    ? `${ctx.parentName}'s child (age ${ctx.childAge})`
    : `${ctx.parentName}'s child`;

  await sendMail(
    ctx.parentEmail,
    "Your Trial Class is Confirmed — Meeting Link Inside",
    baseTemplate(
      "Trial Class Booking Confirmed",
      `Hi ${ctx.parentName}, your trial class with ${ctx.mentorName} has been booked successfully.`,
      detailRow("Class", `Free trial class with ${ctx.mentorName}`) +
        detailRow("When", slot) +
        detailRow("Student", reason) +
        detailRow("Booking ID", ctx.bookingId),
      ctx.meetingLink,
      "Join Meeting",
    ),
  );
};

export const sendMentorBookingEmail = async (
  ctx: BookingEmailContext,
): Promise<void> => {
  const slot = formatSlot(ctx.startsAt, ctx.endsAt);
  const reason = ctx.childAge
    ? `${ctx.parentName}'s child (age ${ctx.childAge})`
    : `${ctx.parentName}'s child`;

  await sendMail(
    ctx.mentorEmail,
    "New Trial Class Booked — Meeting Link Inside",
    baseTemplate(
      "New Trial Class Booked",
      `Hi ${ctx.mentorName}, a parent has booked a trial class with you.`,
      detailRow("Student", reason) +
        detailRow("Parent email", ctx.parentEmail) +
        detailRow("When", slot) +
        detailRow("Booking ID", ctx.bookingId),
      ctx.meetingLink,
      "Join Meeting",
    ),
  );
};

export const sendBookingEmails = async (
  ctx: BookingEmailContext,
): Promise<void> => {
  const results = await Promise.allSettled([
    sendParentBookingEmail(ctx),
    sendMentorBookingEmail(ctx),
  ]);

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const recipient = index === 0 ? ctx.parentEmail : ctx.mentorEmail;
      logger.error(
        { error: result.reason, recipient },
        "Failed to send booking email",
      );
    }
  });
};
