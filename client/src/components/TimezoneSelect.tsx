import { useMemo } from "react";
import { COMMON_TIMEZONES } from "../lib/time";

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
}

const TimezoneSelect = ({ value, onChange }: TimezoneSelectProps) => {
  const options = useMemo(() => {
    const unique = new Set([value, ...COMMON_TIMEZONES]);
    return Array.from(unique);
  }, [value]);

  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-3 text-slate-400">
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path
            d="M3 12h18M12 3c2.5 2.6 4 5.6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.6-4-9s1.5-6.4 4-9z"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Your timezone"
        className="w-full appearance-none rounded-xl border border-white/20 bg-white py-2.5 pl-9 pr-9 text-sm font-semibold text-slate-900 shadow-card transition outline-none hover:shadow-lift focus:ring-2 focus:ring-brand-300 sm:w-64"
      >
        {options.map((zone) => (
          <option key={zone} value={zone}>
            {zone.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 text-slate-400">
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
};

export default TimezoneSelect;
