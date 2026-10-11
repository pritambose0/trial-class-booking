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
    <div className="tabs-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {days.map((day) => {
        const isActive = day === selected;
        const count = slotCounts[day] ?? 0;
        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelect(day)}
            aria-pressed={isActive}
            className={`flex min-w-28 flex-col items-center gap-1 rounded-2xl border px-4 py-3 text-sm transition-all duration-200 ${
              isActive
                ? "border-brand-600 bg-linear-to-b from-brand-600 to-brand-700 text-white shadow-card"
                : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:shadow-soft"
            }`}
          >
            <span className="font-bold">{relativeDayLabel(day, todayKey)}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                isActive
                  ? "bg-white/20 text-brand-50"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {count} {count === 1 ? "slot" : "slots"}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DayTabs;
