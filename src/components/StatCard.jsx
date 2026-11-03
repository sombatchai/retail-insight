import { Wallet, Coins, Receipt, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

const ICONS = {
  wallet: Wallet,
  coins: Coins,
  receipt: Receipt,
  "trending-down": TrendingDown,
};

export default function StatCard({ label, value, delta, trend, icon }) {
  const Icon = ICONS[icon] ?? Wallet;
  const isUp = trend === "up";

  return (
    <div className="card flex items-start justify-between p-5">
      <div>
        <p className="text-[13px] text-ink-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-ink-900">{value}</p>
        <p
          className={`mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium ${
            isUp ? "text-mint-500" : "text-rose-500"
          }`}
        >
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {delta}
          <span className="text-ink-300 font-normal">เทียบสัปดาห์ก่อน</span>
        </p>
      </div>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          isUp ? "bg-brand-50 text-brand-600" : "bg-rose-50 text-rose-500"
        }`}
      >
        <Icon size={20} />
      </span>
    </div>
  );
}
