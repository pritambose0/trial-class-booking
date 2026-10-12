import { relativeDayLabel } from "../lib/time";

interface DayTabsProps {
  days: string[];
  selected: string;
  todayKey: string;
  slotCounts: Record<string, number>;
  onSelect: (day: string) => void;
}

const DayTabs = ({
  days,
  selected,
  todayKey,
  slotCounts,
  onSelect,
}: DayTabsProps) => {
  return (
    <div
      className="tabs-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      role="group"
      aria-label="Choose a day"
    >
      {days.map((day) => {
        const isActive = day === selected;
        const count = slotCounts[day] ?? 0;
        const isFull = count === 0;
        const label = relativeDayLabel(day, todayKey);

        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelect(day)}
            aria-pressed={isActive}
            aria-label={`${label}, ${count} ${count === 1 ? "slot" : "slots"} available`}
            className={`flex min-w-28 shrink-0 flex-col items-center gap-1 rounded-2xl border px-4 py-3 text-sm transition-all duration-200 ${
              isActive
                ? "border-brand-600 bg-brand-600 text-white shadow-card"
                : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:shadow-soft"
            }`}
          >
            <span className="font-bold">{label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                isActive
                  ? "bg-white/20 text-brand-50"
                  : isFull
                    ? "bg-slate-100 text-slate-400"
                    : "bg-brand-50 text-brand-600"
              }`}
            >
              {isFull ? "Full" : `${count} ${count === 1 ? "slot" : "slots"}`}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DayTabs;
