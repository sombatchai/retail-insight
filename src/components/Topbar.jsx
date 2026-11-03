import { Menu, Bell, ChevronDown } from "lucide-react";

export default function Topbar({ title, onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[#ecedf5] bg-white/80 px-5 py-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-ink-500 hover:bg-mist lg:hidden"
          aria-label="เปิดเมนู"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-[17px] font-semibold text-ink-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="hidden items-center gap-2 rounded-full border border-[#e4e6f2] bg-white px-3.5 py-2 text-[13px] font-medium text-ink-700 hover:bg-mist sm:flex">
          1 – 7 ก.ค. 2568
          <ChevronDown size={14} />
        </button>
        <button className="relative rounded-full p-2 text-ink-500 hover:bg-mist" aria-label="การแจ้งเตือน">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>
        <div className="flex items-center gap-2 border-l border-[#ecedf5] pl-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[13px] font-semibold text-brand-700">
            น
          </span>
          <span className="hidden text-[13px] font-medium text-ink-700 sm:inline">
            คุณ นัชชา
          </span>
        </div>
      </div>
    </header>
  );
}
