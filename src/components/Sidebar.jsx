import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  TrendingUp,
  Sparkles,
  BrainCircuit,
  PackageSearch,
  ArchiveX,
  Database,
  LogOut,
  ShoppingBag,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "ภาพรวม", icon: LayoutGrid, end: true },
  { to: "/trends", label: "แนวโน้มยอดขาย", icon: TrendingUp },
  { to: "/forecast", label: "พยากรณ์ยอดขาย", icon: Sparkles },
  { to: "/ai-insight", label: "AI Insight", icon: BrainCircuit },
  { to: "/products", label: "จัดการสินค้า", icon: PackageSearch },
  { to: "/dead-stock", label: "Dead Stock", icon: ArchiveX },
  { to: "/data", label: "ข้อมูลและสถิติ", icon: Database },
];

export default function Sidebar({ open, onNavigate }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-[#ecedf5] bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex shrink-0 items-center gap-2.5 px-6 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
          <ShoppingBag size={18} strokeWidth={2.25} />
        </span>
        <span className="text-[17px] font-semibold leading-none text-ink-900">
          Retail <span className="text-brand-600">Insight</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-500 hover:bg-mist hover:text-ink-900"
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-[#ecedf5] p-3">
        <NavLink
          to="/login"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium text-ink-500 hover:bg-mist hover:text-rose-500"
        >
          <LogOut size={18} strokeWidth={2} />
          ออกจากระบบ
        </NavLink>
      </div>
    </aside>
  );
}