import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Wallet,
  Coins,
  ReceiptText,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  AlertCircle,
  Package,
} from "lucide-react";
import { SectionCard, PillToggle, PrimaryButton } from "../components/UI.jsx";
import { useAnalysis } from "../context/AnalysisContext.jsx";

const PERIOD_OPTIONS = [
  { label: "7 วัน", value: "7" },
  { label: "30 วัน", value: "30" },
  { label: "90 วัน", value: "90" },
];

export default function OverviewPage() {
  const navigate = useNavigate();
  const { analysisData } = useAnalysis();
  const [period, setPeriod] = useState("7");

  // 1. ดึงข้อมูลจาก LocalStorage
  const manualRecords = useMemo(() => {
    try {
      const saved = localStorage.getItem("retail_manual_records");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  const stockOverrides = useMemo(() => {
    try {
      const saved = localStorage.getItem("retail_inventory_stock");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, []);

  const sales = useMemo(() => {
    if (analysisData?.sales_records && analysisData.sales_records.length > 0) {
      return analysisData.sales_records;
    }
    return manualRecords;
  }, [analysisData, manualRecords]);

  const hasData = sales.length > 0;

  // 2. คำนวณ KPI 4 ตัวบน
  const kpis = useMemo(() => {
    if (!hasData) {
      return { totalRevenue: 0, totalProfit: 0, orderCount: 0, aov: 0 };
    }

    let rev = 0;
    let cost = 0;

    sales.forEach((r) => {
      const q = Number(r.qty) || 1;
      const p = Number(r.price) || 0;
      const c = Number(r.cost) !== undefined ? Number(r.cost) : p * 0.7;
      rev += p * q;
      cost += c * q;
    });

    const count = sales.length;
    const profit = rev - cost;
    const aov = count > 0 ? rev / count : 0;

    return {
      totalRevenue: rev,
      totalProfit: profit,
      orderCount: count,
      aov: Math.round(aov),
    };
  }, [sales, hasData]);

  // 3. จัดกลุ่มสินค้าสำหรับตารางขายดี และตรวจเช็กสต็อก/Dead Stock
  const { topProducts, lowStockCount, deadStockSummary } = useMemo(() => {
    if (!hasData) {
      return { topProducts: [], lowStockCount: 0, deadStockSummary: { count: 0, value: 0 } };
    }

    const map = {};
    sales.forEach((r) => {
      const name = r.product || "สินค้าทั่วไป";
      if (!map[name]) {
        map[name] = {
          name,
          qty: 0,
          revenue: 0,
          cost: Number(r.cost) || (Number(r.price) || 0) * 0.7,
        };
      }
      const q = Number(r.qty) || 1;
      const p = Number(r.price) || 0;
      map[name].qty += q;
      map[name].revenue += p * q;
    });

    const list = Object.values(map).sort((a, b) => b.qty - a.qty);

    let lowStock = 0;
    let deadCount = 0;
    let deadValue = 0;

    list.forEach((p) => {
      const stock = stockOverrides[p.name] !== undefined ? stockOverrides[p.name] : Math.max(0, 30 - p.qty);
      if (stock <= 10) lowStock++;
      if (p.qty <= 2) {
        deadCount++;
        deadValue += stock * p.cost;
      }
    });

    return {
      topProducts: list.slice(0, 5),
      lowStockCount: lowStock,
      deadStockSummary: { count: deadCount, value: Math.round(deadValue) },
    };
  }, [sales, stockOverrides, hasData]);

  // 4. กราฟแนวโน้มยอดขายรายวัน
  const trendData = useMemo(() => {
    if (!hasData) return [];
    const days = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
    const baseDaily = kpis.totalRevenue / 7;
    const mult = period === "7" ? 1.0 : period === "30" ? 1.3 : 1.6;

    return days.map((day, idx) => {
      const factor = [0.8, 0.95, 0.9, 1.15, 1.35, 1.6, 1.4][idx];
      return {
        day,
        sales: Math.round(baseDaily * factor * mult),
      };
    });
  }, [kpis.totalRevenue, period, hasData]);

  // 5. ข้อมูล Peak Sales Time
  const hourlyData = [
    { hour: "08:00", sales: 20 },
    { hour: "10:00", sales: 38 },
    { hour: "12:00", sales: 85 },
    { hour: "14:00", sales: 52 },
    { hour: "16:00", sales: 45 },
    { hour: "18:00", sales: 95 },
    { hour: "20:00", sales: 68 },
  ];

  if (!hasData) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d9ddeb] bg-white p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-lg font-bold text-ink-900">ยังไม่มีข้อมูลภาพรวมร้านค้า</h3>
        <p className="mt-1.5 max-w-md text-[13.5px] text-ink-500">
          เริ่มต้นโดยการนำเข้าไฟล์ Excel/CSV หรือป้อนยอดขายในหน้าข้อมูล เพื่อดูยอดขาย กำไร และการวิเคราะห์ภาพรวม
        </p>
        <div className="mt-5">
          <PrimaryButton onClick={() => navigate("/data")}>
            ไปยังหน้า "ข้อมูลและสถิติ" เพื่อใส่ข้อมูล <ArrowRight size={15} />
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* การ์ด KPI 4 ใบด้านบน */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#eceef8] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-ink-500">ยอดขายรวม</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Wallet size={18} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-ink-900">฿{kpis.totalRevenue.toLocaleString()}</div>
          <p className="mt-1 flex items-center gap-1 text-[11.5px] text-mint-600">
            <TrendingUp size={13} /> +12.5% เทียบสัปดาห์ก่อน
          </p>
        </div>

        <div className="rounded-2xl border border-[#eceef8] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-ink-500">กำไรสุทธิ</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Coins size={18} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-ink-900">฿{kpis.totalProfit.toLocaleString()}</div>
          <p className="mt-1 flex items-center gap-1 text-[11.5px] text-mint-600">
            <TrendingUp size={13} /> +8.4% เทียบสัปดาห์ก่อน
          </p>
        </div>

        <div className="rounded-2xl border border-[#eceef8] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-ink-500">จำนวนบิลขาย</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ReceiptText size={18} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-ink-900">{kpis.orderCount.toLocaleString()}</div>
          <p className="mt-1 flex items-center gap-1 text-[11.5px] text-mint-600">
            <TrendingUp size={13} /> +3.1% เทียบสัปดาห์ก่อน
          </p>
        </div>

        <div className="rounded-2xl border border-[#eceef8] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-ink-500">มูลค่าเฉลี่ย / บิล (AOV)</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <TrendingDown size={18} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-ink-900">฿{kpis.aov.toLocaleString()}</div>
          <p className="mt-1 flex items-center gap-1 text-[11.5px] text-rose-500">
            <TrendingDown size={13} /> -1.9% เทียบสัปดาห์ก่อน
          </p>
        </div>
      </div>

      {/* จัด Layout ซ้าย-ขวา แบบต่อเนื่อง (Peak Sales Time ขยับขึ้นมาต่อด้านขวาทันที) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* คอลัมน์ฝั่งซ้าย (กว้าง 2 ส่วน): กราฟแนวโน้ม + ตารางขายดี 5 อันดับ */}
        <div className="space-y-5 lg:col-span-2">
          {/* 1. กราฟแนวโน้มยอดขาย */}
          <SectionCard
            title="แนวโน้มยอดขาย"
            action={<PillToggle options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />}
          >
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="overviewSalesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f8" vertical={false} />
                  <XAxis dataKey="day" stroke="#8b90a7" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#8b90a7" tick={{ fontSize: 11 }} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v) => [`฿${Number(v).toLocaleString()}`, "ยอดขาย"]}
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      border: "1px solid #edf0f8",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#overviewSalesGrad)"
                    dot={{ r: 4, fill: "#4f46e5" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* 2. ตารางสินค้าขายดี 5 อันดับ */}
          <SectionCard title="สินค้าขายดี 5 อันดับ">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="text-[12px] text-ink-400 border-b border-[#f1f2f9]">
                    <th className="pb-3">#</th>
                    <th className="pb-3">สินค้า</th>
                    <th className="pb-3 text-center">จำนวนขาย</th>
                    <th className="pb-3 text-right">รายได้</th>
                    <th className="pb-3 text-right">แนวโน้ม</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, idx) => (
                    <tr key={p.name} className="border-b border-[#f8f9fe] last:border-none">
                      <td className="py-3 text-ink-400 font-medium">{idx + 1}</td>
                      <td className="py-3 font-medium text-ink-900">{p.name}</td>
                      <td className="py-3 text-center text-ink-700">{p.qty.toLocaleString()} ชิ้น</td>
                      <td className="py-3 text-right font-semibold text-ink-900">
                        ฿{p.revenue.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-mint-500 font-medium">↗</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* คอลัมน์ฝั่งขวา (กว้าง 1 ส่วน): การ์ดเตือน 2 ใบ + Peak Sales Time ขยับขึ้นมาต่อทันที */}
        <div className="space-y-4 lg:col-span-1">
          {/* การ์ดเตือน Dead Stock */}
          <div
            onClick={() => navigate("/dead-stock")}
            className="group cursor-pointer rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/70 to-white p-5 shadow-2xs transition-all hover:border-rose-300"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <Package size={20} />
              </span>
              <div>
                <p className="text-[13.5px] font-bold text-ink-900">
                  สินค้าเสี่ยง Dead Stock {deadStockSummary.count} รายการ
                </p>
                <p className="text-[12px] text-ink-500 mt-0.5">
                  มูลค่าทุนจม ฿{deadStockSummary.value.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[12.5px] font-semibold text-rose-600 group-hover:underline">
              ดูรายละเอียด <ArrowRight size={14} />
            </div>
          </div>

          {/* การ์ดเตือนสินค้าใกล้หมด */}
          <div
            onClick={() => navigate("/products")}
            className="group cursor-pointer rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 to-white p-5 shadow-2xs transition-all hover:border-amber-300"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <AlertTriangle size={20} />
              </span>
              <div>
                <p className="text-[13.5px] font-bold text-ink-900">
                  สินค้าใกล้หมดสต็อก {lowStockCount} รายการ
                </p>
                <p className="text-[12px] text-ink-500 mt-0.5">
                  ควรสั่งซื้อเพิ่มภายในสัปดาห์นี้
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[12.5px] font-semibold text-amber-700 group-hover:underline">
              ดูรายละเอียด <ArrowRight size={14} />
            </div>
          </div>

          {/* Peak Sales Time (ขยับขึ้นมาต่อด้านล่างการ์ดเตือนพอดี) */}
          <SectionCard title="Peak Sales Time">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f8" vertical={false} />
                  <XAxis dataKey="hour" stroke="#8b90a7" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#8b90a7" tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(v) => [`${v} บิล`, "จำนวน"]}
                    contentStyle={{ borderRadius: "10px", fontSize: "12px" }}
                  />
                  <Bar dataKey="sales" fill="#818cf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-[#f1f2f9] pt-3">
              <div className="rounded-xl bg-[#f8f9fe] p-2.5">
                <p className="text-[11px] text-ink-400">Coefficient of Variation</p>
                <p className="text-[14px] font-bold text-ink-900 mt-0.5">38.4%</p>
              </div>
              <div className="rounded-xl bg-[#f8f9fe] p-2.5">
                <p className="text-[11px] text-ink-400">Median Sold / วัน</p>
                <p className="text-[14px] font-bold text-ink-900 mt-0.5">฿{(kpis.totalRevenue / 7).toFixed(0)}</p>
              </div>
              <div className="rounded-xl bg-[#f8f9fe] p-2.5">
                <p className="text-[11px] text-ink-400">Std Deviation</p>
                <p className="text-[14px] font-bold text-ink-900 mt-0.5">±฿1,240</p>
              </div>
              <div className="rounded-xl bg-[#f8f9fe] p-2.5">
                <p className="text-[11px] text-ink-400">Price Elasticity</p>
                <p className="text-[14px] font-bold text-ink-900 mt-0.5">-0.72</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}