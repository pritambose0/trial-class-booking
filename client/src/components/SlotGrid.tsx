import type { AvailabilitySlot } from "../lib/types";
import { formatTime } from "../lib/time";

interface SlotGridProps {
  slots: AvailabilitySlot[];
  timezone: string;
  dayLabel: string;
  onPick: (slot: AvailabilitySlot) => void;
}

const SlotGrid = ({ slots, timezone, dayLabel, onPick }: SlotGridProps) => {
  return (
    <div
      role="group"
      aria-label={`Available times for ${dayLabel}`}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      {slots.map((slot) => {
        const startTime = formatTime(slot.startsAt, timezone);
        const endTime = formatTime(slot.endsAt, timezone);

        if (!slot.available) {
          return (
            <div
              key={slot.startsAt}
              aria-disabled="true"
              className="flex cursor-not-allowed flex-col items-center gap-1 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center"
            >
              <span className="text-lg font-bold text-slate-300 line-through decoration-slate-300">
                {startTime}
              </span>
              <span className="text-xs text-slate-300">
                {slot.startsAtIST} IST
              </span>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                <svg
                  className="size-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M6 6l12 12" strokeLinecap="round" />
                </svg>
                Full
              </span>
            </div>
          );
        }

        return (
          <button
            key={slot.startsAt}
            type="button"
            onClick={() => onPick(slot)}
            aria-label={`Book ${startTime} to ${endTime}, ${slot.startsAtIST} IST`}
            className="group flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-card active:translate-y-0"
          >
            <span className="text-lg font-bold text-slate-900">
              {startTime}
            </span>
            <span className="text-xs text-slate-400">
              until {endTime}
            </span>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600 ring-1 ring-inset ring-brand-100 transition-colors group-hover:bg-brand-100">
              <svg
                className="size-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  d="M12 7v5l3 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {slot.startsAtIST} IST
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SlotGrid;
