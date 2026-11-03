export function SectionCard({ title, action, children, className = "" }) {
  return (
    <div className={`card p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function PillToggle({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-full bg-mist p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
            value === opt.value
              ? "bg-white text-brand-700 shadow-sm"
              : "text-ink-500 hover:text-ink-900"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    ปกติ: "bg-mint-50 text-mint-500",
    ใกล้หมด: "bg-amber-50 text-amber-500",
    สินค้าขายดี: "bg-brand-50 text-brand-600",
    หมดสต๊อก: "bg-rose-50 text-rose-500",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium ${map[status] ?? "bg-mist text-ink-500"}`}>
      {status}
    </span>
  );
}

export function LinkButton({ children, ...props }) {
  return (
    <button
      className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
      {...props}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
