import { useEffect, useMemo, useRef, useState } from "react";
import BookingModal from "./components/BookingModal";
import Confirmation from "./components/Confirmation";
import DayTabs from "./components/DayTabs";
import Header from "./components/Header";
import SlotGrid from "./components/SlotGrid";
import {
  AvailabilitySkeleton,
  Banner,
  MessageCard,
  Spinner,
} from "./components/Status";
import TimezoneSelect from "./components/TimezoneSelect";
import {
  ApiRequestError,
  getAvailability,
  invalidateAvailabilityCache,
} from "./lib/api";
import {
  addDays,
  detectTimeZone,
  formatZoneLabel,
  relativeDayLabel,
  zonedDateKey,
} from "./lib/time";
import { DAYS_PER_PAGE, IST_ZONE } from "./constants";
import type { AvailabilitySlot, Booking } from "./lib/types";

const EMPTY_SLOTS: Record<string, AvailabilitySlot[]> = {};

type LoadStatus = "loading" | "ready" | "error";

interface LoadResult {
  timezone: string;
  slots: Record<string, AvailabilitySlot[]>;
  todayLocal: string;
}

const FEATURES = [
  { icon: "users", label: "1-on-1 mentors" },
  { icon: "clock", label: "30 minutes" },
  { icon: "check", label: "Free, no card" },
  { icon: "globe", label: "Any timezone" },
] as const;

const HOW_IT_WORKS = [
  {
    title: "Pick a time",
    text: "Any slot that fits — dates and times are shown in your timezone.",
  },
  {
    title: "We match a mentor",
    text: "An available mentor is assigned automatically, so you don't have to choose.",
  },
  {
    title: "Get the live link",
    text: "You and the mentor receive the meeting link by email.",
  },
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
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<LoadResult | null>(null);
  const [selectedDay, setSelectedDay] = useState("");
  const [activeSlot, setActiveSlot] = useState<AvailabilitySlot | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Tick once a minute so slots that have started since the last fetch disappear
  // from the grid without needing a network round-trip.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const bookingRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const previous = dataRef.current;
    const sameZone = previous?.timezone === timezone;

    // Keep the current day grid on screen while more days load; only show the
    // full skeleton when the timezone (which reshapes every time) changes.
    if (sameZone) {
      setRefreshing(true);
    } else {
      setStatus("loading");
    }

    const todayIST = zonedDateKey(new Date(), IST_ZONE);
    const dates = Array.from({ length: dayCount }, (_, index) =>
      addDays(todayIST, index),
    );

    Promise.all(dates.map((date) => getAvailability(date, timezone)))
      .then((results) => {
        if (cancelled) return;

        const now = Date.now();
        const grouped: Record<string, AvailabilitySlot[]> = {};

        // Keep every future slot (bookable and full) so full days render as
        // disabled slots, but drop times that have already started.
        for (const availability of results) {
          for (const slot of availability.slots) {
            if (new Date(slot.startsAt).getTime() <= now) continue;
            const dayKey = zonedDateKey(slot.startsAt, timezone);
            (grouped[dayKey] ??= []).push(slot);
          }
        }

        for (const dayKey of Object.keys(grouped)) {
          grouped[dayKey].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        }

        setData({
          timezone,
          slots: grouped,
          todayLocal: zonedDateKey(new Date(), timezone),
        });
        setStatus("ready");
        setRefreshing(false);
        setErrorMessage("");

        setSelectedDay((prev) => {
          if (prev && grouped[prev]) return prev;
          const ordered = Object.keys(grouped).sort();
          const firstOpen = ordered.find((key) =>
            grouped[key].some((slot) => slot.available),
          );
          return firstOpen ?? ordered[0] ?? "";
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Something went wrong while loading availability.";
        setRefreshing(false);
        // If the current screen still has valid data (e.g. "show more days"
        // failed), keep it visible and surface a quiet banner instead.
        if (sameZone && dataRef.current) {
          setErrorMessage(message);
        } else {
          setStatus("error");
          setErrorMessage(message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [timezone, dayCount, reloadKey]);

  const visible = data && data.timezone === timezone ? data : null;
  // Re-filter on every tick so a slot that has started since the last fetch
  // never lingers as "Full"; future slots (including full ones) stay visible.
  const slotsByDay = useMemo(() => {
    if (!visible) return EMPTY_SLOTS;
    const grouped: Record<string, AvailabilitySlot[]> = {};
    for (const [dayKey, slots] of Object.entries(visible.slots)) {
      const upcoming = slots.filter(
        (slot) => new Date(slot.startsAt).getTime() > now,
      );
      if (upcoming.length > 0) grouped[dayKey] = upcoming;
    }
    return grouped;
  }, [visible, now]);
  const todayLocal = visible?.todayLocal ?? "";

  const days = useMemo(() => Object.keys(slotsByDay).sort(), [slotsByDay]);
  // Fall back to the first day with an open slot (or just the first day) when
  // the selected day is gone, e.g. once its last remaining slot has started.
  const activeDay =
    selectedDay && slotsByDay[selectedDay]
      ? selectedDay
      : (days.find((key) => slotsByDay[key].some((slot) => slot.available)) ??
        days[0] ??
        "");
  const daySlots = activeDay ? (slotsByDay[activeDay] ?? []) : [];

  const slotCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [key, slots] of Object.entries(slotsByDay)) {
      counts[key] = slots.filter((slot) => slot.available).length;
    }
    return counts;
  }, [slotsByDay]);

  const loading = !visible && status !== "error";
  const loadError = !visible && status === "error" ? errorMessage : null;
  const refreshError = visible ? errorMessage : null;
  const hasAnyAvailable = days.some((day) => (slotCounts[day] ?? 0) > 0);
  const selectedDayFull =
    daySlots.length > 0 && daySlots.every((slot) => !slot.available);

  const loadMoreDays = () => setDayCount((count) => count + DAYS_PER_PAGE);
  const scrollToBooking = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bookingRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  };

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
            <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-700 to-indigo-700 px-6 py-8 text-white shadow-lift animate-fade-in-up sm:px-10 sm:py-10">
              <div
                className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-200">
                  Free 30-minute trial class
                </p>
                <h1 className="mt-2 max-w-2xl text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                  A live 1-on-1 coding class, booked around your child&apos;s
                  schedule
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-indigo-100 sm:text-base">
                  Pick a time that works for you. We&apos;ll match an available
                  mentor automatically and email the live class link — no
                  payment, no commitment.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {FEATURES.map(({ icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-inset ring-white/25"
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

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={scrollToBooking}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-700 shadow-lift transition hover:bg-brand-50 active:scale-[0.99]"
                  >
                    <svg
                      className="size-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
                      <path
                        d="M3.5 10h17M8 3v4M16 3v4"
                        strokeLinecap="round"
                      />
                    </svg>
                    Choose a time
                  </button>
                  <p className="text-sm text-indigo-100">
                    Times shown in{" "}
                    <span className="font-semibold text-white">
                      {formatZoneLabel(timezone)}
                    </span>
                  </p>
                </div>
              </div>
            </section>

            <ol className="mt-5 grid gap-3 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 ring-1 ring-inset ring-brand-100">
                    {index + 1}
                  </span>
                  <h3 className="mt-2 text-sm font-bold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>

            <section
              id="booking"
              ref={bookingRef}
              className="mt-8 scroll-mt-20 space-y-4 animate-fade-in-up"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                    Pick a day and time
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    All times below are in your timezone; the mentor&apos;s IST
                    time is shown under each slot.
                  </p>
                </div>
                <div className="shrink-0">
                  <label
                    htmlFor="timezone-select"
                    className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Your timezone
                  </label>
                  <TimezoneSelect
                    id="timezone-select"
                    value={timezone}
                    onChange={setTimezone}
                  />
                </div>
              </div>

              {loading ? (
                <AvailabilitySkeleton />
              ) : loadError ? (
                <MessageCard
                  tone="error"
                  title="We couldn't load available classes"
                  description={loadError}
                  actionLabel="Try again"
                  onAction={() => setReloadKey((key) => key + 1)}
                />
              ) : days.length === 0 ? (
                <MessageCard
                  title="No trial classes available right now"
                  description="All mentors are fully booked for the coming days. Try showing more days, or check back later."
                  actionLabel="Show more days"
                  onAction={loadMoreDays}
                />
              ) : (
                <div className="space-y-5">
                  <DayTabs
                    days={days}
                    selected={activeDay}
                    todayKey={todayLocal}
                    slotCounts={slotCounts}
                    onSelect={setSelectedDay}
                  />

                  {!hasAnyAvailable ? (
                    <MessageCard
                      title="All slots are full for the next few days"
                      description="New times open up as mentors become available. You can look further ahead."
                      actionLabel="Show more days"
                      onAction={loadMoreDays}
                    />
                  ) : (
                    <div className="space-y-3">
                      {selectedDayFull ? (
                        <Banner tone="info">
                          This day is fully booked — pick another day or load
                          more days.
                        </Banner>
                      ) : null}
                      <SlotGrid
                        slots={daySlots}
                        timezone={timezone}
                        dayLabel={
                          activeDay
                            ? relativeDayLabel(activeDay, todayLocal)
                            : ""
                        }
                        onPick={setActiveSlot}
                      />
                    </div>
                  )}

                  {refreshError ? (
                    <Banner tone="warning">
                      {refreshError} Showing previous times — try loading more
                      days.
                    </Banner>
                  ) : null}

                  <button
                    type="button"
                    onClick={loadMoreDays}
                    disabled={refreshing}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-soft transition hover:border-brand-300 hover:text-brand-700 hover:shadow-card active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {refreshing ? (
                      <Spinner label="Loading more days…" inline />
                    ) : (
                      "Show more days"
                    )}
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