import { useState, useEffect } from "react";
import { Trash2, ShoppingCart, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { SectionCard, PrimaryButton } from "../../components/UI.jsx";
import { useAnalysis } from "../../context/AnalysisContext.jsx";

const initialForm = {
  date: new Date().toISOString().split("T")[0],
  product: "",
  category: "เครื่องดื่ม",
  qty: "",
  price: "",
  cost: "",
};

export default function ManualEntryTab() {
  const [form, setForm] = useState(initialForm);
  const [savedMessage, setSavedMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addManualRecord } = useAnalysis();

  // โหลดข้อมูลที่เคยบันทึกไว้จาก localStorage
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem("retail_manual_records");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("retail_manual_records", JSON.stringify(records));
  }, [records]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  // Live Preview คำนวณแบบ Real-time
  const previewQty = Number(form.qty) || 0;
  const previewPrice = Number(form.price) || 0;
  const previewCost = form.cost !== "" ? Number(form.cost) : Number((previewPrice * 0.7).toFixed(2));
  const previewTotalSales = previewQty * previewPrice;
  const previewProfit = (previewPrice - previewCost) * previewQty;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.product.trim() || previewQty <= 0 || previewPrice <= 0) return;

    setIsSubmitting(true);

    const newRecord = {
      id: Date.now(),
      date: form.date,
      product: form.product.trim(),
      category: form.category,
      qty: previewQty,
      price: previewPrice,
      cost: previewCost,
      total: previewTotalSales,
      profit: previewProfit,
    };

    // ส่งเข้า API Backend เพื่อเก็บลง Database จริง (ถ้าเปิด backend อยู่)
    try {
      await fetch("http://localhost:8000/transactions/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      }).catch(() => {
        // หาก backend ยังไม่เปิด ให้เก็บใน frontend ต่อได้ตามปกติ
      });
    } catch (err) {
      console.warn("Backend offline, saving locally only.");
    }

    // อัปเดตข้อมูลในหน้าเว็บ
    setRecords((prev) => [newRecord, ...prev]);
    if (addManualRecord) addManualRecord(newRecord);

    setIsSubmitting(false);
    setSavedMessage(true);
    setForm({
      ...initialForm,
      date: form.date,
      category: form.category,
    });

    setTimeout(() => setSavedMessage(false), 3000);
  }

  const handleDelete = (id) => {
    setRecords((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm("คุณต้องการล้างรายการที่บันทึกไว้ทั้งหมดหรือไม่?")) {
      setRecords([]);
      localStorage.removeItem("retail_manual_records");
    }
  };

  const totalAccumulatedSales = records.reduce((sum, item) => sum + item.total, 0);
  const totalAccumulatedProfit = records.reduce((sum, item) => sum + (item.profit || 0), 0);

  return (
    <div className="space-y-5">
      <SectionCard title="ป้อนข้อมูลยอดขายด้วยตนเอง (Manual Entry)">
        <form className="space-y-4 max-w-2xl" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-700">วันที่ขาย</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={update("date")}
                className="w-full rounded-xl border border-[#e4e6f2] bg-white px-4 py-2.5 text-[14px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-700">หมวดหมู่</label>
              <select
                value={form.category}
                onChange={update("category")}
                className="w-full rounded-xl border border-[#e4e6f2] bg-white px-4 py-2.5 text-[14px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option>เครื่องดื่ม</option>
                <option>ขนมและของว่าง</option>
                <option>ของสดและเบเกอรี่</option>
                <option>ของใช้ทั่วไป</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-700">ชื่อสินค้า</label>
            <input
              type="text"
              required
              placeholder="เช่น โค้ก, น้ำดื่ม 600ml หรือ ขนมปัง"
              value={form.product}
              onChange={update("product")}
              className="w-full rounded-xl border border-[#e4e6f2] bg-white px-4 py-2.5 text-[14px] outline-none placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-700">จำนวนที่ขาย</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                placeholder="0"
                value={form.qty}
                onChange={update("qty")}
                className="w-full rounded-xl border border-[#e4e6f2] bg-white px-4 py-2.5 text-[14px] outline-none placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-700">ราคาขาย (฿)</label>
              {/* ใช้ step="any" เพื่อรับได้ทุกค่าทศนิยม เช่น 10, 10.5, 10.25 โดยไม่ติด error */}
              <input
                type="number"
                min="0"
                step="any"
                required
                placeholder="0.00"
                value={form.price}
                onChange={update("price")}
                className="w-full rounded-xl border border-[#e4e6f2] bg-white px-4 py-2.5 text-[14px] outline-none placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-700">ต้นทุน/หน่วย (฿)</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="เว้นไว้ = 70%"
                value={form.cost}
                onChange={update("cost")}
                className="w-full rounded-xl border border-[#e4e6f2] bg-white px-4 py-2.5 text-[14px] outline-none placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          {/* แถบคำนวณสด Real-time */}
          {(previewQty > 0 || previewPrice > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-mist p-3.5 text-[13px]">
              <span className="text-ink-700">
                ยอดขายรวม: <strong className="text-brand-600">฿{previewTotalSales.toLocaleString()}</strong>
              </span>
              <span className="text-ink-700">
                ต้นทุนรวม: ฿{(previewCost * previewQty).toLocaleString()}
              </span>
              <span className="text-ink-700">
                กำไรคาดการณ์: <strong className="text-mint-500 font-semibold">฿{previewProfit.toLocaleString()}</strong>
              </span>
            </div>
          )}

          <PrimaryButton type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
            บันทึกรายการขาย
          </PrimaryButton>

          {savedMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-mint-50 px-4 py-2.5 text-[13px] font-medium text-mint-500">
              <CheckCircle2 size={16} /> บันทึกข้อมูลสำเร็จและเพิ่มลงในระบบแล้ว
            </div>
          )}
        </form>
      </SectionCard>

      {/* ตารางแสดงผลจริงที่บันทึกแล้ว */}
      <SectionCard
        title={`รายการที่บันทึกด้วยตนเอง (${records.length} รายการ)`}
        action={
          records.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[12.5px] font-medium text-rose-500 hover:text-rose-700"
            >
              ล้างทั้งหมด
            </button>
          )
        }
      >
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-ink-300">
            <AlertCircle size={32} className="mb-2 stroke-[1.5]" />
            <p className="text-[13.5px]">ยังไม่มีข้อมูลที่บันทึกด้วยตนเอง</p>
            <p className="text-[12px]">กรอกข้อมูลผ่านแบบฟอร์มด้านบนเพื่อเริ่มบันทึกยอดขาย</p>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#edf0f8] bg-[#fbfbfe] p-3">
                <p className="text-[12px] text-ink-500">ยอดขายรวมสะสม</p>
                <p className="text-lg font-semibold text-brand-600">฿{totalAccumulatedSales.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-[#edf0f8] bg-[#fbfbfe] p-3">
                <p className="text-[12px] text-ink-500">กำไรสุทธิสะสม</p>
                <p className="text-lg font-semibold text-mint-500">฿{totalAccumulatedProfit.toLocaleString()}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="text-[12px] text-ink-500">
                    <th className="pb-3 font-medium">วันที่</th>
                    <th className="pb-3 font-medium">สินค้า</th>
                    <th className="pb-3 font-medium">หมวดหมู่</th>
                    <th className="pb-3 font-medium">จำนวน</th>
                    <th className="pb-3 font-medium">ราคาขาย</th>
                    <th className="pb-3 font-medium">ยอดขายรวม</th>
                    <th className="pb-3 font-medium text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((item) => (
                    <tr key={item.id} className="border-t border-[#f1f2f9]">
                      <td className="py-2.5 text-ink-700">{item.date}</td>
                      <td className="py-2.5 font-medium text-ink-900">{item.product}</td>
                      <td className="py-2.5 text-ink-500 text-[12.5px]">{item.category}</td>
                      <td className="py-2.5 text-ink-700">{item.qty.toLocaleString()} ชิ้น</td>
                      <td className="py-2.5 text-ink-700">฿{Number(item.price).toFixed(2)}</td>
                      <td className="py-2.5 font-semibold text-mint-500">฿{item.total.toLocaleString()}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-ink-300 hover:text-rose-500"
                          aria-label="ลบ"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}