import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env.js";
import logger from "./logger.js";

const { host, port, secure, user, pass } = env.smtp;

// The mailer is considered configured only when SMTP credentials are present.
// Without them we fall back to a JSON transport so development flows keep
// working and the generated emails are logged instead of being delivered.
export const isMailerConfigured = Boolean(host && user && pass);

export const transporter: Transporter = isMailerConfigured
  ? nodemailer.createTransport({
      host,
      port: port ?? 587,
      secure,
      auth: { user, pass },
    })
  : nodemailer.createTransport({ jsonTransport: true });

if (!isMailerConfigured) {
  logger.warn(
    "SMTP is not configured; booking emails will be generated and logged instead of sent.",
  );
}
