interface SpinnerProps {
  label: string;
}

export const Spinner = ({ label }: SpinnerProps) => (
  <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white/80 py-20 text-slate-500">
    <span className="relative flex size-10" role="status" aria-label="Loading">
      <span className="absolute inset-0 rounded-full border-2 border-brand-200" />
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-600" />
    </span>
    <p className="text-sm font-medium">{label}</p>
  </div>
);

interface MessageCardProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const iconPaths = {
  empty: (
    <>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  error: (
    <>
      <path
        d="M12 8v5M12 16.5h.01"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  info: (
    <>
      <path
        d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
        strokeLinejoin="round"
      />
    </>
  ),
} as const;

export const MessageCard = ({
  title,
  description,
  actionLabel,
  onAction,
}: MessageCardProps) => (
  <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/80 px-6 py-14 text-center backdrop-blur-[2px]">
    <span className="flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-brand-50 to-brand-100 text-brand-500 ring-1 ring-inset ring-brand-100">
      <svg
        className="size-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.08" />
        {iconPaths.empty}
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
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-brand-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:brightness-110 active:scale-[0.98]"
      >
        {actionLabel}
      </button>
    ) : null}
  </div>
);
