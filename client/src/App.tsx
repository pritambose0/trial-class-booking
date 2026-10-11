import { useEffect, useMemo, useState } from "react";
import BookingModal from "./components/BookingModal";
import Confirmation from "./components/Confirmation";
import DayTabs from "./components/DayTabs";
import Header from "./components/Header";
import SlotGrid from "./components/SlotGrid";
import { MessageCard, Spinner } from "./components/Status";
import TimezoneSelect from "./components/TimezoneSelect";
import {
  ApiRequestError,
  getAvailability,
  invalidateAvailabilityCache,
} from "./lib/api";
import { IST_ZONE, addDays, detectTimeZone, zonedDateKey } from "./lib/time";
import type { AvailabilitySlot, Booking } from "./lib/types";

const DAYS_PER_PAGE = 8;

const EMPTY_SLOTS: Record<string, AvailabilitySlot[]> = {};

interface LoadResult {
  key: string;
  slots: Record<string, AvailabilitySlot[]>;
  todayLocal: string;
}

interface LoadFailure {
  key: string;
  message: string;
}

const FEATURES = [
  { icon: "users", label: "10 mentors" },
  { icon: "clock", label: "30 minutes" },
  { icon: "check", label: "Free, no card" },
  { icon: "globe", label: "Any timezone" },
] as const;

const featureIcons: Record<(typeof FEATURES)[number]["icon"], React.ReactNode> =
  {
    users: (
      <path
        d="M16 19c0-2-2.7-3.5-6-3.5S4 17 4 19M12 12.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19 10.5a2.5 2.5 0 1 1-5 0M19 16.5c.6-.6 1-1.5 1-2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    clock: <circle cx="12" cy="12" r="9" />,
    check: (
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    ),
    globe: (
      <path
        d="M3.5 10h17M12 3.5c2 2.6 3 5.6 3 8.5s-1 5.9-3 8.5c-2-2.6-3-5.6-3-8.5s1-5.9 3-8.5zM3.5 14h17"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  };

const App = () => {
  const [timezone, setTimezone] = useState(detectTimeZone);
  const [dayCount, setDayCount] = useState(DAYS_PER_PAGE);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [failure, setFailure] = useState<LoadFailure | null>(null);
  const [selectedDay, setSelectedDay] = useState("");
  const [activeSlot, setActiveSlot] = useState<AvailabilitySlot | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let cancelled = false;
    const key = `${timezone}|${dayCount}|${reloadKey}`;
    const todayIST = zonedDateKey(new Date(), IST_ZONE);
    const dates = Array.from({ length: dayCount }, (_, index) =>
      addDays(todayIST, index),
    );

    Promise.all(dates.map((date) => getAvailability(date, timezone)))
      .then((results) => {
        if (cancelled) return;

        const now = Date.now();
        const grouped: Record<string, AvailabilitySlot[]> = {};

        for (const availability of results) {
          for (const slot of availability.slots) {
            if (!slot.available) continue;
            if (new Date(slot.startsAt).getTime() <= now) continue;
            const dayKey = zonedDateKey(slot.startsAt, timezone);
            (grouped[dayKey] ??= []).push(slot);
          }
        }

        for (const dayKey of Object.keys(grouped)) {
          grouped[dayKey].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        }

        setResult({
          key,
          slots: grouped,
          todayLocal: zonedDateKey(new Date(), timezone),
        });
        setFailure(null);

        const keys = Object.keys(grouped).sort();
        setSelectedDay((prev) =>
          prev && grouped[prev] ? prev : (keys[0] ?? ""),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFailure({
          key,
          message:
            err instanceof ApiRequestError
              ? err.message
              : "Something went wrong while loading availability.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [timezone, dayCount, reloadKey]);

  const requestKey = `${timezone}|${dayCount}|${reloadKey}`;
  const current = result?.key === requestKey ? result : null;
  const loadError = failure?.key === requestKey ? failure.message : null;
  const loading = !current && !loadError;
  const slotsByDay = useMemo(() => current?.slots ?? EMPTY_SLOTS, [current]);
  const todayLocal = current?.todayLocal ?? "";

  const days = useMemo(() => Object.keys(slotsByDay).sort(), [slotsByDay]);
  const daySlots = selectedDay ? (slotsByDay[selectedDay] ?? []) : [];
  const slotCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [key, value] of Object.entries(slotsByDay)) {
      counts[key] = value.length;
    }
    return counts;
  }, [slotsByDay]);

  const reset = () => {
    setBooking(null);
    setActiveSlot(null);
    setReloadKey((key) => key + 1);
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {booking ? (
          <Confirmation booking={booking} onReset={reset} />
        ) : (
          <>
            <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-700 via-brand-600 to-indigo-600 px-6 py-8 text-white shadow-lift animate-fade-in-up sm:px-10 sm:py-12">
              <div
                className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-white/10 blur-3xl"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-indigo-300/20 blur-3xl"
                aria-hidden="true"
              />

              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-200">
                  Free 30-minute trial class
                </p>
                <h1 className="mt-2 max-w-xl text-2xl font-extrabold leading-tight text-white sm:text-4xl">
                  Book a live coding class that fits{" "}
                  <span className="bg-linear-to-r from-brand-200 to-indigo-200 bg-clip-text text-transparent">
                    your timezone
                  </span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-indigo-100 sm:text-base">
                  One-on-one with an expert mentor. Pick a slot below and
                  we&apos;ll match you instantly — no payment, no commitment.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {FEATURES.map(({ icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm"
                    >
                      <svg
                        className="size-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        {featureIcons[icon]}
                      </svg>
                      {label}
                    </span>
                  ))}
                </div>

                <div className="mt-7 flex flex-col gap-3 border-t border-white/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">
                      Your local timezone
                    </p>
                    <p className="mt-0.5 text-sm text-indigo-100">
                      Slots are converted to your time automatically.
                    </p>
                  </div>
                  <TimezoneSelect value={timezone} onChange={setTimezone} />
                </div>
              </div>
            </section>

            <section
              className="mt-8 space-y-4 animate-fade-in-up"
              style={{ animationDelay: "80ms" }}
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                    Pick a day and time
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    All times in{" "}
                    <span className="font-semibold text-slate-700">
                      {timezone.replace(/_/g, " ")}
                    </span>{" "}
                    — we assign an available mentor automatically.
                  </p>
                </div>
                <span className="hidden shrink-0 text-xs font-medium text-slate-400 sm:inline">
                  IST shown under each slot
                </span>
              </div>

              {loading ? (
                <Spinner label="Finding available mentors…" />
              ) : loadError ? (
                <MessageCard
                  title="We couldn't load available classes"
                  description={loadError}
                  actionLabel="Try again"
                  onAction={() => setReloadKey((key) => key + 1)}
                />
              ) : days.length === 0 ? (
                <MessageCard
                  title="No trial classes available"
                  description="All mentors are fully booked for the coming days. Try loading more days, or check back later."
                  actionLabel="Show more days"
                  onAction={() => setDayCount((count) => count + DAYS_PER_PAGE)}
                />
              ) : (
                <div className="space-y-5">
                  <DayTabs
                    days={days}
                    selected={selectedDay}
                    todayKey={todayLocal}
                    slotCounts={slotCounts}
                    onSelect={setSelectedDay}
                  />
                  <SlotGrid
                    slots={daySlots}
                    timezone={timezone}
                    onPick={setActiveSlot}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDayCount((count) => count + DAYS_PER_PAGE)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-soft transition hover:border-brand-300 hover:text-brand-700 hover:shadow-card active:scale-[0.99]"
                  >
                    Show more days
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        <footer className="mt-10 border-t border-slate-200 pt-6 text-center">
          <p className="text-xs text-slate-400">
            Trial classes run 09:00–18:00 IST · 30 minutes · mentors are
            assigned automatically.
          </p>
        </footer>
      </main>

      {activeSlot ? (
        <BookingModal
          slot={activeSlot}
          timezone={timezone}
          onClose={() => setActiveSlot(null)}
          onBooked={(created) => {
            setActiveSlot(null);
            invalidateAvailabilityCache();
            setBooking(created);
          }}
        />
      ) : null}
    </div>
  );
};

export default App;
