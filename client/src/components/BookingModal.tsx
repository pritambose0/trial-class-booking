import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiRequestError, createBooking } from "../lib/api";
import { formatDayShort, formatTime } from "../lib/time";
import type { AvailabilitySlot, Booking } from "../lib/types";

interface BookingModalProps {
  slot: AvailabilitySlot;
  timezone: string;
  onClose: () => void;
  onBooked: (booking: Booking) => void;
}

const BookingModal = ({
  slot,
  timezone,
  onClose,
  onBooked,
}: BookingModalProps) => {
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [childAge, setChildAge] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const requestClose = () => {
    if (!submitting) onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const booking = await createBooking({
        parentName: parentName.trim(),
        parentEmail: parentEmail.trim(),
        childAge: childAge.trim() === "" ? undefined : Number(childAge),
        timezone,
        startsAt: slot.startsAt,
      });
      onBooked(booking);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        const map: Record<string, string> = {};
        for (const item of err.fieldErrors) map[item.field] = item.message;
        setFieldErrors(map);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (name: string) =>
    fieldErrors[name] ? (
      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
        <svg
          className="size-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5h.01" strokeLinecap="round" />
        </svg>
        {fieldErrors[name]}
      </p>
    ) : null;

  const inputClass = (name: string) =>
    `mt-1 w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 ${
      fieldErrors[name]
        ? "border-red-300 bg-red-50"
        : "border-slate-300 bg-slate-50"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={requestClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-scale-in sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        <div className="bg-linear-to-br from-brand-700 to-indigo-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">
                Trial class
              </p>
              <p
                id="booking-modal-title"
                className="mt-1 text-xl font-extrabold"
              >
                {formatDayShort(slot.startsAt, timezone)} ·{" "}
                {formatTime(slot.startsAt, timezone)} (
                {timezone.replace(/_/g, " ")})
              </p>
              <p className="mt-1 text-sm text-brand-100">
                Your mentor&apos;s time: {slot.startsAtIST} IST
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              disabled={submitting}
              aria-label="Close booking form"
              className="rounded-full p-1.5 text-brand-100 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="parent-name"
              >
                Parent / guardian name
              </label>
              <input
                id="parent-name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                autoFocus
                value={parentName}
                onChange={(event) => setParentName(event.target.value)}
                placeholder="Jane Doe"
                className={inputClass("parentName")}
              />
              {fieldError("parentName")}
            </div>

            <div>
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="parent-email"
              >
                Email
              </label>
              <input
                id="parent-email"
                type="email"
                required
                autoComplete="email"
                value={parentEmail}
                onChange={(event) => setParentEmail(event.target.value)}
                placeholder="jane@example.com"
                className={inputClass("parentEmail")}
              />
              {fieldError("parentEmail")}
            </div>

            <div>
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="child-age"
              >
                Child&apos;s age{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="child-age"
                type="number"
                min={3}
                max={18}
                value={childAge}
                onChange={(event) => setChildAge(event.target.value)}
                placeholder="e.g. 9"
                className={inputClass("childAge") + " max-w-32"}
              />
              {fieldError("childAge")}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                What happens next
              </p>
              <ul className="mt-2 space-y-2">
                {[
                  ["Assign", "We match you with an available mentor."],
                  ["Email", "You and your mentor get the class link."],
                  ["Join", "Click the link at your chosen time."],
                ].map(([step, text]) => (
                  <li
                    key={step}
                    className="flex items-start gap-2.5 text-sm text-slate-600"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                      ✓
                    </span>
                    <span>
                      <span className="font-semibold text-slate-700">
                        {step}:
                      </span>{" "}
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                <svg
                  className="mt-0.5 size-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16.5h.01" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-card transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Booking…
                </>
              ) : (
                "Confirm trial class"
              )}
            </button>
            <p className="text-center text-xs text-slate-400">
              Free — no payment details required · We&apos;ll also email you the
              link
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
