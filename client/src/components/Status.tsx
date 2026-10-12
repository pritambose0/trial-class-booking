interface SpinnerProps {
  label: string;
  inline?: boolean;
}

export const Spinner = ({ label, inline = false }: SpinnerProps) => (
  <div
    className={
      inline
        ? "flex items-center justify-center gap-2.5 text-slate-500"
        : "flex flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white/80 py-20 text-slate-500"
    }
    role="status"
  >
    <span
      className={inline ? "relative flex size-5" : "relative flex size-10"}
      aria-hidden="true"
    >
      <span className="absolute inset-0 rounded-full border-2 border-brand-200" />
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-600" />
    </span>
    <p className={inline ? "text-xs font-semibold" : "text-sm font-medium"}>
      {label}
    </p>
  </div>
);

// Placeholder shown while the first batch of availability loads.
export const AvailabilitySkeleton = () => (
  <div className="space-y-5" aria-hidden="true">
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="skeleton h-[70px] min-w-28 flex-1 rounded-2xl"
        />
      ))}
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="skeleton h-[92px] rounded-2xl"
        />
      ))}
    </div>
  </div>
);

type MessageTone = "empty" | "error" | "info";

interface MessageCardProps {
  title: string;
  description: string;
  tone?: MessageTone;
  actionLabel?: string;
  onAction?: () => void;
}

const iconPaths: Record<MessageTone, React.ReactNode> = {
  empty: (
    <path
      d="M8 7V5.5a4 4 0 1 1 8 0V7m-9 0h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  error: (
    <path
      d="M12 8v5M12 16.5h.01"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  info: (
    <path
      d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
      strokeLinejoin="round"
    />
  ),
};

const toneStyles: Record<MessageTone, string> = {
  empty: "from-brand-50 to-brand-100 text-brand-500 ring-brand-100",
  error: "from-red-50 to-red-100 text-red-500 ring-red-100",
  info: "from-brand-50 to-brand-100 text-brand-500 ring-brand-100",
};

export const MessageCard = ({
  title,
  description,
  tone = "info",
  actionLabel,
  onAction,
}: MessageCardProps) => (
  <div
    role={tone === "error" ? "alert" : undefined}
    className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center animate-fade-in"
  >
    <span
      className={`flex size-14 items-center justify-center rounded-2xl bg-linear-to-br ring-1 ring-inset ${toneStyles[tone]}`}
    >
      <svg
        className="size-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.08" />
        {tone === "error" ? (
          <>
            <circle cx="12" cy="12" r="9" opacity="0" />
            {iconPaths.error}
          </>
        ) : (
          iconPaths[tone]
        )}
      </svg>
    </span>
    <h3 className="text-base font-bold text-slate-900">{title}</h3>
    <p className="max-w-sm text-sm leading-relaxed text-slate-500">
      {description}
    </p>
    {actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700 active:scale-[0.98]"
      >
        {actionLabel}
      </button>
    ) : null}
  </div>
);

interface BannerProps {
  tone?: "info" | "warning" | "success" | "error";
  children: React.ReactNode;
}

const bannerTones = {
  info: "border-brand-200 bg-brand-50 text-brand-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
} as const;

// Compact inline notice used for transitory states (e.g. a fully-booked day).
export const Banner = ({ tone = "info", children }: BannerProps) => (
  <div
    role={tone === "error" ? "alert" : undefined}
    className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm ${bannerTones[tone]}`}
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
      {tone === "error" ? (
        <path d="M12 8v5M12 16.5h.01" strokeLinecap="round" />
      ) : (
        <>
          <path d="M12 8v5" strokeLinecap="round" />
          <path d="M12 16.5h.01" strokeLinecap="round" />
        </>
      )}
    </svg>
    <p className="leading-relaxed">{children}</p>
  </div>
);
