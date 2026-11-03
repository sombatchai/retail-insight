import { useState, useMemo } from "react";
import { ArchiveX, Wallet, TrendingDown, AlertCircle, Sparkles, Tag, Check, Filter } from "lucide-react";
import { SectionCard, PrimaryButton, PillToggle } from "../components/UI.jsx";
import { useAnalysis } from "../context/AnalysisContext.jsx";

const THRESHOLD_OPTIONS = [
  { label: "ค้างเกิน 30 วัน", value: 30 },
  { label: "ค้างเกิน 60 วัน", value: 60 },
  { label: "ค้างเกิน 90 วัน", value: 90 },
];

export default function DeadStockPage() {
  const { analysisData } = useAnalysis();
  const [threshold, setThreshold] = useState(30);
  const [selectedAction, setSelectedAction] = useState(null);
  const [clearedItems, setClearedItems] = useState([]);

  // ดึงรายการจาก LocalStorage (กรณีป้อนมือ) หรือจาก Backend Analysis
  const deadStockItems = useMemo(() => {
    // 1. ถ้ามีข้อมูลจาก Backend
    if (analysisData?.deadstock?.items && analysisData.deadstock.items.length > 0) {
      return analysisData.deadstock.items.filter((item) => item.daysIdle >= threshold);
    }

    // 2. ถ้าไม่มีข้อมูล ให้คืนค่าเป็น Array ว่าง [] เพื่อไม่ให้แสดง Mock Data หลอกตา
    return [];
  }, [analysisData, threshold]);

  // กรองรายการที่ไม่ถูกกดเคลียร์ไปแล้ว
  const activeItems = deadStockItems.filter((item) => !clearedItems.includes(item.id || item.name));

  // คำนวณยอดเงินจมรวม
  const totalLockedCash = activeItems.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  // ฟังก์ชันจำลองการเคลียร์สต็อก
  const handleClearStock = (item) => {
    setSelectedAction(item);
  };

  const confirmAction = (strategy) => {
    if (selectedAction) {
      setClearedItems((prev) => [...prev, selectedAction.id || selectedAction.name]);
      alert(`ดำเนินการระบายสต็อก "${selectedAction.name}" ด้วยกลยุทธ์: ${strategy} เรียบร้อยแล้ว`);
      setSelectedAction(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* การ์ด KPI 3 กล่องด้านบน */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
            <ArchiveX size={20} />
          </span>
          <div>
            <p className="text-[13px] text-ink-500">Dead Stock ทั้งหมด</p>
            <p className="text-xl font-semibold text-ink-900">
              {activeItems.length > 0 ? `${activeItems.length} รายการ` : "0 รายการ"}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-3 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <Wallet size={20} />
          </span>
          <div>
            <p className="text-[13px] text-ink-500">มูลค่าสินค้าเงินจม (Locked Cash)</p>
            <p className="text-xl font-semibold text-ink-900">
              ฿{totalLockedCash.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-3 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-50 text-mint-500">
            <TrendingDown size={20} />
          </span>
          <div>
            <p className="text-[13px] text-ink-500">ลดลงจากเดือนก่อน</p>
            <p className="text-xl font-semibold text-ink-900">
              {activeItems.length > 0 ? "15%" : "0%"}
            </p>
          </div>
        </div>
      </div>

      {/* แถบตัวกรองเกณฑ์จำนวนวัน */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-ink-500" />
          <span className="text-[13px] font-medium text-ink-700">เกณฑ์ตรวจจับ Dead Stock:</span>
          <PillToggle
            options={THRESHOLD_OPTIONS}
            value={threshold}
            onChange={(val) => setThreshold(Number(val))}
          />
        </div>
        <span className="text-[12px] text-ink-500">
          * นับจากวันที่ขายล่าสุดเทียบกับวันปัจจุบัน
        </span>
      </div>

      {/* ตารางรายการสินค้า Dead Stock */}
      <SectionCard
        title={`รายการสินค้า Dead Stock (ค้างเกิน ${threshold} วัน)`}
        action={
          activeItems.length > 0 && (
            <PrimaryButton onClick={() => alert("ระบบกำลังสร้างแคมเปญ Clearance Sale อัตโนมัติ")}>
              ทำรายการ Clearance ทั้งหมด
            </PrimaryButton>
          )
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="text-[12px] text-ink-500">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">สินค้า</th>
                <th className="pb-3 font-medium">ขายล่าสุด</th>
                <th className="pb-3 font-medium">ค้างสต๊อก (วัน)</th>
                <th className="pb-3 font-medium">มูลค่าเงินจม</th>
                <th className="pb-3 font-medium text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {activeItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-300">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Check size={32} className="text-mint-500 stroke-[2]" />
                      <p className="text-[14px] font-medium text-ink-700">ไม่พบสินค้า Dead Stock ในเกณฑ์นี้</p>
                      <p className="text-[12px] text-ink-500">
                        สต็อกหมุนเวียนได้ดี หรือยังไม่มีข้อมูลนำเข้าจากไฟล์
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                activeItems.map((item, i) => (
                  <tr key={item.name} className="border-t border-[#f1f2f9]">
                    <td className="py-3 text-ink-500">{i + 1}</td>
                    <td className="py-3 font-medium text-ink-900">{item.name}</td>
                    <td className="py-3 text-ink-700">{item.lastSold || "-"}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[12px] font-medium text-rose-500">
                        {item.daysIdle} วัน
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-ink-900">
                      ฿{Number(item.value).toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleClearStock(item)}
                        className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-[12.5px] font-medium text-brand-600 hover:bg-brand-100"
                      >
                        แนะนำวิธีระบายสต็อก
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Modal แนะนำแนวทางระบายสินค้าเงินจม (Actionable Decision Support) */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 text-brand-600">
              <Sparkles size={20} />
              <h3 className="text-lg font-semibold text-ink-900">
                แนวทางระบายสต็อก: {selectedAction.name}
              </h3>
            </div>
            <p className="mt-1 text-[13px] text-ink-500">
              สินค้าค้างมาแล้ว {selectedAction.daysIdle} วัน มูลค่าเงินจม ฿{Number(selectedAction.value).toLocaleString()}
            </p>

            <div className="mt-4 space-y-3">
              <div
                onClick={() => confirmAction("Clearance Sale ลด 40-50%")}
                className="cursor-pointer rounded-xl border border-[#e4e6f2] p-3.5 transition-colors hover:border-brand-500 hover:bg-brand-50/50"
              >
                <div className="flex items-center justify-between font-medium text-ink-900 text-[13.5px]">
                  <span>1. Clearance Sale (ลดราคาพิเศษ 40-50%)</span>
                  <Tag size={15} className="text-rose-500" />
                </div>
                <p className="mt-1 text-[12px] text-ink-500">
                  เหมาะสำหรับระบายสต็อกให้เร็วที่สุดเพื่อดึงเงินสดกลับมาหมุนเวียน
                </p>
              </div>

              <div
                onClick={() => confirmAction("Bundle Promotion พ่วงสินค้าขายดี")}
                className="cursor-pointer rounded-xl border border-[#e4e6f2] p-3.5 transition-colors hover:border-brand-500 hover:bg-brand-50/50"
              >
                <div className="flex items-center justify-between font-medium text-ink-900 text-[13.5px]">
                  <span>2. Bundle Promotion (จัดเซ็ตคู่สินค้าขายดี)</span>
                  <Sparkles size={15} className="text-amber-500" />
                </div>
                <p className="mt-1 text-[12px] text-ink-500">
                  พ่วงคู่กับสินค้า Top Seller โดยลดราคาแพ็ครวม ช่วยดันสินค้าออกโดยไม่เสียภาพลักษณ์แบรนด์
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setSelectedAction(null)}
                className="rounded-xl px-4 py-2 text-[13px] font-medium text-ink-500 hover:bg-mist"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}