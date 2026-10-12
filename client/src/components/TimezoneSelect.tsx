import { useMemo } from "react";
import { formatZoneLabel, getTimezoneGroups } from "../lib/time";

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
  id?: string;
}

const TimezoneSelect = ({ value, onChange, id }: TimezoneSelectProps) => {
  const { common, all } = useMemo(() => getTimezoneGroups(value), [value]);

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
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Your timezone"
        className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-sm font-semibold text-slate-800 shadow-soft outline-none transition hover:border-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:w-72"
      >
        <optgroup label="Common timezones">
          {common.map((zone) => (
            <option key={zone} value={zone}>
              {formatZoneLabel(zone)}
            </option>
          ))}
        </optgroup>
        {all.length > 0 ? (
          <optgroup label="All timezones">
            {all.map((zone) => (
              <option key={zone} value={zone}>
                {formatZoneLabel(zone)}
              </option>
            ))}
          </optgroup>
        ) : null}
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
