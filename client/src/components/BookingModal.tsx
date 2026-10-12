import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ApiRequestError, createBooking } from "../lib/api";
import { formatDayShort, formatTime, formatZoneLabel } from "../lib/time";
import {
  MAX_CHILD_AGE,
  MAX_PARENT_NAME_LENGTH,
  MIN_CHILD_AGE,
  MIN_PARENT_NAME_LENGTH,
} from "../constants";
import type { AvailabilitySlot, Booking } from "../lib/types";

interface BookingModalProps {
  slot: AvailabilitySlot;
  timezone: string;
  onClose: () => void;
  onBooked: (booking: Booking) => void;
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

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

  const dialogRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submittingRef.current) {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !dialogRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialogRef.current.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const requestClose = () => {
    if (!submittingRef.current) onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submittingRef.current) return;
    submittingRef.current = true;
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
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const inputClass = (name: string) =>
    `mt-1 w-full rounded-xl border px-3.5 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 sm:py-2.5 sm:text-sm ${
      fieldErrors[name]
        ? "border-red-300 bg-red-50"
        : "border-slate-300 bg-white"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={requestClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-scale-in sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        aria-describedby="booking-modal-description"
      >
        <div className="shrink-0 bg-linear-to-br from-brand-700 to-indigo-600 px-5 pb-4 pt-4 text-white sm:px-6 sm:pb-5 sm:pt-5">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">
                Trial class · 30 minutes
              </p>
              <p
                id="booking-modal-title"
                className="mt-1 text-lg font-extrabold leading-tight sm:text-xl"
              >
                {formatDayShort(slot.startsAt, timezone)} ·{" "}
                {formatTime(slot.startsAt, timezone)} –{" "}
                {formatTime(slot.endsAt, timezone)}
              </p>
              <p
                id="booking-modal-description"
                className="mt-1 text-sm text-brand-100"
              >
                In your timezone ({formatZoneLabel(timezone)}). Mentor&apos;s
                time: {slot.startsAtIST} IST
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              disabled={submitting}
              aria-label="Close booking form"
              className="shrink-0 rounded-full p-1.5 text-brand-100 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-5">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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
                minLength={MIN_PARENT_NAME_LENGTH}
                maxLength={MAX_PARENT_NAME_LENGTH}
                autoComplete="name"
                autoFocus
                aria-invalid={Boolean(fieldErrors.parentName)}
                aria-describedby={
                  fieldErrors.parentName ? "parent-name-error" : undefined
                }
                value={parentName}
                onChange={(event) => setParentName(event.target.value)}
                placeholder="Jane Doe"
                className={inputClass("parentName")}
              />
              {fieldErrors.parentName ? (
                <p
                  id="parent-name-error"
                  className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600"
                >
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
                  {fieldErrors.parentName}
                </p>
              ) : null}
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
                aria-invalid={Boolean(fieldErrors.parentEmail)}
                aria-describedby={
                  fieldErrors.parentEmail ? "parent-email-error" : undefined
                }
                value={parentEmail}
                onChange={(event) => setParentEmail(event.target.value)}
                placeholder="jane@example.com"
                className={inputClass("parentEmail")}
              />
              {fieldErrors.parentEmail ? (
                <p
                  id="parent-email-error"
                  className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600"
                >
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
                  {fieldErrors.parentEmail}
                </p>
              ) : null}
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
                min={MIN_CHILD_AGE}
                max={MAX_CHILD_AGE}
                aria-invalid={Boolean(fieldErrors.childAge)}
                aria-describedby={
                  fieldErrors.childAge ? "child-age-error" : undefined
                }
                value={childAge}
                onChange={(event) => setChildAge(event.target.value)}
                placeholder="e.g. 9"
                className={inputClass("childAge") + " max-w-full sm:max-w-32"}
              />
              {fieldErrors.childAge ? (
                <p
                  id="child-age-error"
                  className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600"
                >
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
                  {fieldErrors.childAge}
                </p>
              ) : null}
            </div>

            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
              >
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-card transition hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    aria-hidden="true"
                  />
                  Booking your trial…
                </>
              ) : (
                "Confirm trial class"
              )}
            </button>
            <p className="text-center text-xs text-slate-400">
              Free — no payment details required. We&apos;ll email you the class
              link and match you with an available mentor.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
