const Header = () => (
  <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
      <a
        href="#"
        className="flex items-center gap-3"
        aria-label="Codeyoung — book a trial class"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-card">
          <svg
            className="size-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
        </span>
        <span className="leading-tight">
          <span className="block text-base font-bold text-slate-900">
            Codeyoung
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600">
            Trial classes
          </span>
        </span>
      </a>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          10 mentors ready
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
          09:00–18:00 IST
        </span>
      </div>
    </div>
  </header>
);

export default Header;
