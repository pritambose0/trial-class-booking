import { useState } from "react";
import {
  formatDayShort,
  formatFullDateTime,
  formatTime,
  formatZoneLabel,
} from "../lib/time";
import { IST_ZONE } from "../constants";
import type { Booking } from "../lib/types";

interface ConfirmationProps {
  booking: Booking;
  onReset: () => void;
}

const Confirmation = ({ booking, onReset }: ConfirmationProps) => {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(booking.meetingLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const details = [
    {
      label: "Your mentor",
      value: booking.mentor?.name ?? "Assigned mentor",
    },
    {
      label: "When (your time)",
      value: `${formatDayShort(booking.startsAt, booking.timezone)} · ${formatTime(booking.startsAt, booking.timezone)} – ${formatTime(booking.endsAt, booking.timezone)} (${formatZoneLabel(booking.timezone)})`,
    },
    {
      label: "Mentor's time (IST)",
      value: formatFullDateTime(booking.startsAt, IST_ZONE),
    },
  ];

  const nextSteps = [
    "We've matched you with a mentor and emailed the details.",
    "Open the live link a few minutes before your class.",
    "Join from any laptop or tablet — no downloads needed.",
  ];

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-200 animate-fade-in-up">
      <div className="bg-emerald-500 px-6 py-8 text-center text-white">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/20">
          <svg
            className="size-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path
              d="M5 13l4 4L19 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1 className="mt-4 text-2xl font-extrabold">Your class is booked!</h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-emerald-50">
          We emailed a confirmation to{" "}
          <span className="font-semibold text-white">
            {booking.parentEmail}
          </span>
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {details.map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col justify-between gap-1 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-4"
            >
              <dt className="text-sm text-slate-500">{label}</dt>
              <dd className="text-left text-sm font-semibold text-slate-900 sm:max-w-[60%] sm:text-right">
                {value}
              </dd>
            </div>
          ))}
          <div className="flex flex-col justify-between gap-1 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-4">
            <dt className="text-sm text-slate-500">Booking ID</dt>
            <dd className="break-all text-left text-xs font-medium text-slate-500 sm:text-right">
              {booking._id}
            </dd>
          </div>
        </dl>

        <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50 p-4">
          <div className="flex items-center gap-2">
            <svg
              className="size-4 text-brand-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d="M10 15a4 4 0 0 0 4 4 4 4 0 0 0 4-4M10 15l-6 0M14 19l-2 3M4 15l2 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-sm font-bold text-brand-900">Live class link</p>
          </div>
          <p className="mt-0.5 text-xs text-brand-600/80">
            Works best in Chrome — join a few minutes before your slot.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <a
              href={booking.meetingLink}
              target="_blank"
              rel="noreferrer"
              title={booking.meetingLink}
              className="flex-1 truncate rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-bold text-white shadow-card transition hover:bg-brand-700 active:scale-[0.99]"
            >
              Join meeting
            </a>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 active:scale-[0.99]"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
          <p className="mt-2.5 truncate text-xs text-slate-500" title={booking.meetingLink}>
            {booking.meetingLink}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 px-4 py-3.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            What happens next
          </p>
          <ol className="mt-2 space-y-2">
            {nextSteps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-2.5 text-sm text-slate-600"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
        >
          Book another class
        </button>
      </div>
    </div>
  );
};

export default Confirmation;