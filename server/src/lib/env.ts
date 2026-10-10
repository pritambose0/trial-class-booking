import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: required("NODE_ENV", "development"),
  port: Number(required("PORT", "4000")),
  clientOrigin: required("CLIENT_ORIGIN", "http://localhost:5173"),
  mongoURI: required("MONGODB_URI"),
  mongoDBName: process.env.MONGODB_DB_NAME,
  // Base URL used to generate dummy meeting links for trial classes.
  meetingBaseUrl: required("MEETING_BASE_URL", "https://meet.jit.si"),
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: required("MAIL_FROM", "Trial Class Booking <no-reply@trialclass.local>"),
  },
} as const;
