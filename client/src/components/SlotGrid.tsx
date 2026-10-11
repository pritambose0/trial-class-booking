import type { AvailabilitySlot } from "../lib/types";
import { formatTime } from "../lib/time";

interface SlotGridProps {
  slots: AvailabilitySlot[];
  timezone: string;
  onPick: (slot: AvailabilitySlot) => void;
}

const SlotGrid = ({ slots, timezone, onPick }: SlotGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {slots.map((slot) => (
        <button
          key={slot.startsAt}
          type="button"
          onClick={() => onPick(slot)}
          className="group flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <span className="text-lg font-bold text-slate-900">
            {formatTime(slot.startsAt, timezone)}
          </span>
          <span className="text-xs text-slate-400">
            until {formatTime(slot.endsAt, timezone)}
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
      ))}
    </div>
  );
};

export default SlotGrid;
