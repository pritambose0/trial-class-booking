import { useState } from "react";
import {
  IST_ZONE,
  formatDayShort,
  formatFullDateTime,
  formatTime,
} from "../lib/time";
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

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-200 animate-fade-in-up">
      <div className="relative bg-linear-to-br from-emerald-500 to-teal-600 px-6 py-8 text-center text-white">
        <div
          className="absolute -top-10 left-1/2 size-40 -translate-x-1/2 rounded-full bg-white/15 blur-2xl"
          aria-hidden="true"
        />
        <span className="relative mx-auto flex size-16 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/25">
          <svg
            className="size-8"
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
        <h2 className="relative mt-4 text-2xl font-extrabold">
          Your class is booked!
        </h2>
        <p className="relative mt-1 text-sm text-emerald-50">
          We emailed the link to{" "}
          <span className="font-semibold">{booking.parentEmail}</span>
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-start justify-between gap-4 px-4 py-3.5">
            <dt className="text-sm text-slate-500">Your mentor</dt>
            <dd className="text-right text-sm font-semibold text-slate-900">
              {booking.mentor?.name ?? "Assigned mentor"}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 px-4 py-3.5">
            <dt className="text-sm text-slate-500">When (your time)</dt>
            <dd className="text-right text-sm font-semibold text-slate-900">
              {formatDayShort(booking.startsAt, booking.timezone)} ·{" "}
              {formatTime(booking.startsAt, booking.timezone)} –{" "}
              {formatTime(booking.endsAt, booking.timezone)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 px-4 py-3.5">
            <dt className="text-sm text-slate-500">Mentor&apos;s time (IST)</dt>
            <dd className="text-right text-sm font-semibold text-slate-900">
              {formatFullDateTime(booking.startsAt, IST_ZONE)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 px-4 py-3.5">
            <dt className="text-sm text-slate-500">Booking ID</dt>
            <dd className="break-all text-right text-xs font-medium text-slate-500">
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
              className="flex-1 truncate rounded-xl bg-linear-to-r from-brand-700 to-indigo-600 px-4 py-2.5 text-center text-sm font-bold text-white shadow-card transition hover:brightness-110 active:scale-[0.99]"
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
