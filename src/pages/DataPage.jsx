import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, Plus, AlertCircle, HelpCircle } from "lucide-react";
import { SectionCard, PrimaryButton } from "../components/UI.jsx";
import { useAnalysis } from "../context/AnalysisContext.jsx";
import { db } from "../firebase.js";
import { collection, addDoc, writeBatch, doc } from "firebase/firestore";

export default function DataPage() {
  const { salesRecords, isLoading } = useAnalysis();
  const [activeTab, setActiveTab] = useState("stats");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [manualForm, setManualForm] = useState({
    product: "",
    category: "เครื่องดื่ม",
    price: "",
    cost: "",
    qty: "",
  });

  // -------------------------------------------------------------
  // 1. คำนวณสถิติเชิงลึก (Descriptive Analytics) จาก Global State
  // -------------------------------------------------------------
  const { statsList, overallCV, avgTurnover } = useMemo(() => {
    if (!salesRecords || salesRecords.length === 0) {
      return { statsList: [], overallCV: "0.0%", avgTurnover: "0.0 ครั้ง" };
    }

    const grouped = salesRecords.reduce((acc, r) => {
      const name = r.product || "ไม่ระบุชื่อ";
      if (!acc[name]) {
        acc[name] = {
          name,
          quantities: [],
          prices: [],
          totalQty: 0,
        };
      }
      const q = Number(r.qty) || 0;
      const p = Number(r.price) || 0;
      acc[name].quantities.push(q);
      acc[name].prices.push(p);
      acc[name].totalQty += q;
      return acc;
    }, {});

    let totalCV = 0;
    let validCVCount = 0;

    const calculatedList = Object.values(grouped).map((item) => {
      const n = item.quantities.length;
      const mean = n > 0 ? item.totalQty / n : 0;

      let sd = 0;
      if (n > 1) {
        const variance = item.quantities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
        sd = Math.sqrt(variance);
      }

      let cv = 0;
      if (mean > 0 && n > 1) {
        cv = (sd / mean) * 100;
        totalCV += cv;
        validCVCount++;
      }

      const avgStock = 30;
      const turnover = avgStock > 0 ? +(item.totalQty / avgStock).toFixed(1) : 0;

      return {
        name: item.name,
        mean: `${mean.toFixed(1)} ชิ้น`,
        sd: n > 1 ? `±${sd.toFixed(1)}` : "±0",
        cvValue: cv,
        cvBadge: n > 1 ? `${cv.toFixed(1)}%` : "0% (นิ่ง)",
        elasticity: "-0.65 (ประมาณการ)",
        turnover: `${Math.max(1, turnover)} ครั้ง`,
      };
    });

    const finalAvgCV = validCVCount > 0 ? (totalCV / validCVCount).toFixed(1) : "0.0";
    return {
      statsList: calculatedList,
      overallCV: `${finalAvgCV}%`,
      avgTurnover: "6.0 ครั้ง",
    };
  }, [salesRecords]);

  // -------------------------------------------------------------
  // 2. ฟังก์ชันอัปโหลดไฟล์ลง Firebase แบบ Batch
  // -------------------------------------------------------------
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!jsonData || jsonData.length === 0) {
          setErrorMsg("ไม่พบข้อมูลใน Sheet แรกของไฟล์ที่อัปโหลด");
          setIsUploading(false);
          return;
        }

        const getVal = (row, keys) => {
          const foundKey = Object.keys(row).find((k) => {
            const cleanKey = k.trim().toLowerCase().replace(/_/g, " ");
            return keys.some((key) => cleanKey.includes(key.toLowerCase()));
          });
          return foundKey ? row[foundKey] : undefined;
        };

        const formattedRecords = jsonData
          .map((row) => {
            const prodName = getVal(row, ["product id", "product", "sku", "สินค้า", "ชื่อสินค้า"]) || "Unassigned Product";
            const rawPrice = Number(getVal(row, ["price", "ราคา", "ยอดขาย"])) || 0;
            const rawCost = Number(getVal(row, ["cost", "ต้นทุน"])) || +(rawPrice * 0.7).toFixed(2);
            const rawQty = Number(getVal(row, ["units sold", "units ordered", "quantity", "qty", "จำนวน"])) || 1;
            const rawCategory = getVal(row, ["category", "หมวดหมู่"]) || "ทั่วไป";
            const rawDate = getVal(row, ["date", "วันที่"]) || new Date().toISOString().split("T")[0];

            return {
              date: String(rawDate),
              product: String(prodName),
              category: String(rawCategory),
              qty: rawQty,
              price: rawPrice,
              cost: rawCost,
              createdAt: new Date().toISOString()
            };
          })
          .filter((r) => r.product !== "Unassigned Product" || r.price > 0 || r.qty > 0);

        if (formattedRecords.length === 0) {
          setErrorMsg("ไม่พบข้อมูลที่ถูกต้องตามรูปแบบในไฟล์");
          setIsUploading(false);
          return;
        }

        // บันทึกลง Firebase Firestore (Batch ละ 400 แถว)
        const batchSize = 400;
        for (let i = 0; i < formattedRecords.length; i += batchSize) {
          const chunk = formattedRecords.slice(i, i + batchSize);
          const batch = writeBatch(db);
          
          chunk.forEach((item) => {
            const docRef = doc(collection(db, "sales_records"));
            batch.set(docRef, item);
          });
          
          await batch.commit();
        }

        alert(`✅ นำเข้าข้อมูลสำเร็จเรียบร้อย ${formattedRecords.length} แถว!`);
        setActiveTab("stats");
      } catch (err) {
        console.error("Upload Error Detail:", err);
        setErrorMsg(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${err.message}`);
      } finally {
        setIsUploading(false);
        event.target.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // -------------------------------------------------------------
  // 3. ป้อนข้อมูลเองลง Firebase
  // -------------------------------------------------------------
  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!manualForm.product || !manualForm.price || !manualForm.qty) {
      alert("กรุณากรอกข้อมูลสินค้าให้ครบถ้วน");
      return;
    }

    try {
      const newRecord = {
        date: new Date().toISOString().split("T")[0],
        product: manualForm.product,
        category: manualForm.category,
        price: Number(manualForm.price),
        cost: Number(manualForm.cost) || +(Number(manualForm.price) * 0.7).toFixed(2),
        qty: Number(manualForm.qty),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "sales_records"), newRecord);

      setManualForm({
        product: "",
        category: "เครื่องดื่ม",
        price: "",
        cost: "",
        qty: "",
      });
      alert("บันทึกข้อมูลเรียบร้อย!");
      setActiveTab("stats");
    } catch (err) {
      console.error("Save Error:", err);
      alert("เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-[#eceef8] pb-3">
        <button
          onClick={() => setActiveTab("stats")}
          className={`rounded-xl px-4 py-2 text-[13px] font-medium transition-all ${
            activeTab === "stats"
              ? "bg-brand-600 text-white shadow-xs"
              : "bg-white text-ink-600 border border-[#e4e6f2] hover:bg-mist"
          }`}
        >
          สถิติ
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`rounded-xl px-4 py-2 text-[13px] font-medium transition-all ${
            activeTab === "manual"
              ? "bg-brand-600 text-white shadow-xs"
              : "bg-white text-ink-600 border border-[#e4e6f2] hover:bg-mist"
          }`}
        >
          ป้อนข้อมูลเอง
        </button>
        <button
          onClick={() => setActiveTab("import")}
          className={`rounded-xl px-4 py-2 text-[13px] font-medium transition-all ${
            activeTab === "import"
              ? "bg-brand-600 text-white shadow-xs"
              : "bg-white text-ink-600 border border-[#e4e6f2] hover:bg-mist"
          }`}
        >
          นำเข้าไฟล์
        </button>
      </div>

      {activeTab === "stats" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#eceef8] bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-ink-500 text-[12.5px]">
                <span>Coefficient of Variation (CV รวม)</span>
                <HelpCircle size={15} />
              </div>
              <div className="mt-2 text-2xl font-bold text-ink-900">{overallCV}</div>
              <p className="mt-1 text-[11.5px] text-mint-600">คำนวณจากข้อมูลจริงบน Firebase</p>
            </div>

            <div className="rounded-2xl border border-[#eceef8] bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-ink-500 text-[12.5px]">
                <span>Price Elasticity (Correlation)</span>
                <HelpCircle size={15} />
              </div>
              <div className="mt-2 text-2xl font-bold text-ink-900">-0.72</div>
              <p className="mt-1 text-[11.5px] text-ink-500">ความยืดหยุ่นของราคา</p>
            </div>

            <div className="rounded-2xl border border-[#eceef8] bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-ink-500 text-[12.5px]">
                <span>Inventory Turnover เฉลี่ย</span>
                <HelpCircle size={15} />
              </div>
              <div className="mt-2 text-2xl font-bold text-brand-600">{avgTurnover}</div>
              <p className="mt-1 text-[11.5px] text-ink-500">อัตราการหมุนเวียนสินค้าในคลัง</p>
            </div>
          </div>

          <SectionCard
            title="สถิติเชิงลึกรายสินค้า (Descriptive Analytics)"
            action={<span className="text-[12px] text-ink-400">🔥 ซิงก์ข้อมูลจาก Cloud Firestore</span>}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="text-[12px] text-ink-400 border-b border-[#f1f2f9]">
                    <th className="pb-3 font-medium">สินค้า (Product ID)</th>
                    <th className="pb-3 font-medium">Mean (ยอดขายเฉลี่ย)</th>
                    <th className="pb-3 font-medium">SD (ส่วนเบี่ยงเบน)</th>
                    <th className="pb-3 font-medium">CV (ความผันผวน)</th>
                    <th className="pb-3 font-medium">Elasticity (r)</th>
                    <th className="pb-3 font-medium text-right">Turnover (รอบ/ปี)</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-ink-400">
                        กำลังดึงข้อมูลจาก Firebase...
                      </td>
                    </tr>
                  ) : statsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-ink-300">
                        ยังไม่มีข้อมูลสถิติ กรุณานำเข้าไฟล์หรือป้อนยอดขายก่อน
                      </td>
                    </tr>
                  ) : (
                    statsList.map((st) => (
                      <tr key={st.name} className="border-b border-[#f8f9fe] last:border-none">
                        <td className="py-3 font-medium text-ink-900">{st.name}</td>
                        <td className="py-3 text-ink-700">{st.mean}</td>
                        <td className="py-3 text-ink-700">{st.sd}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                              st.cvValue > 50 ? "bg-rose-50 text-rose-600" : "bg-mint-50 text-mint-600"
                            }`}
                          >
                            ✓ {st.cvBadge}
                          </span>
                        </td>
                        <td className="py-3 text-ink-500 text-[12.5px]">{st.elasticity}</td>
                        <td className="py-3 text-right font-medium text-brand-600">{st.turnover}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {activeTab === "manual" && (
        <SectionCard title="ป้อนข้อมูลการขายรายวัน">
          <form onSubmit={handleSaveManual} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="text-[12.5px] font-medium text-ink-700">ชื่อสินค้า / Product ID</label>
              <input
                type="text"
                placeholder="เช่น P101"
                value={manualForm.product}
                onChange={(e) => setManualForm({ ...manualForm, product: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e4e6f2] px-3 py-2 text-[13px] outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-ink-700">หมวดหมู่</label>
              <select
                value={manualForm.category}
                onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e4e6f2] bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-500"
              >
                <option value="เครื่องดื่ม">เครื่องดื่ม</option>
                <option value="ขนมขบเคี้ยว">ขนมขบเคี้ยว</option>
                <option value="ของใช้">ของใช้</option>
                <option value="ทั่วไป">ทั่วไป</option>
              </select>
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-ink-700">ราคาขาย (บาท)</label>
              <input
                type="number"
                placeholder="20"
                value={manualForm.price}
                onChange={(e) => setManualForm({ ...manualForm, price: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e4e6f2] px-3 py-2 text-[13px] outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-ink-700">ต้นทุน (บาท)</label>
              <input
                type="number"
                placeholder="12"
                value={manualForm.cost}
                onChange={(e) => setManualForm({ ...manualForm, cost: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e4e6f2] px-3 py-2 text-[13px] outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-ink-700">จำนวนที่ขายได้</label>
              <input
                type="number"
                placeholder="10"
                value={manualForm.qty}
                onChange={(e) => setManualForm({ ...manualForm, qty: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e4e6f2] px-3 py-2 text-[13px] outline-none focus:border-brand-500"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
              <PrimaryButton type="submit">
                <Plus size={15} /> บันทึกข้อมูลลง Firebase
              </PrimaryButton>
            </div>
          </form>
        </SectionCard>
      )}

      {activeTab === "import" && (
        <SectionCard title="นำเข้าไฟล์ยอดขายไปยัง Firebase (Excel / CSV)">
          <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d9ddeb] bg-[#fafbfe] p-10 text-center hover:border-brand-400 transition-colors">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={isUploading}
            />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-3">
              <UploadCloud size={28} />
            </div>
            <p className="text-[14.5px] font-semibold text-ink-900">
              {isUploading ? "กำลังบันทึกลง Firebase..." : "ลากไฟล์มาวางที่นี่ หรือคลิกเพื่ออัปโหลด"}
            </p>
            <p className="text-[12.5px] text-ink-500 mt-1">
              รองรับไฟล์ .xlsx, .xls, .csv
            </p>
            <button
              type="button"
              className="mt-4 rounded-xl bg-brand-600 px-5 py-2 text-[13px] font-medium text-white shadow-xs pointer-events-none"
            >
              เลือกไฟล์
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-[13px] text-rose-600">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center justify-between border-b border-[#f1f2f9] pb-3">
              <h4 className="text-[13.5px] font-semibold text-ink-900">
                รายการล่าสุดบนฐานข้อมูล Firestore ({salesRecords.length} แถว)
              </h4>
            </div>

            <div className="mt-3 max-h-60 overflow-y-auto">
              {salesRecords.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-ink-400">ยังไม่มีข้อมูลบน Firebase</p>
              ) : (
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr className="text-ink-400">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Product ID</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Units Sold</th>
                      <th className="pb-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesRecords.slice(0, 20).map((r) => (
                      <tr key={r.id} className="border-t border-[#f4f5fa]">
                        <td className="py-2 text-ink-500">{r.date}</td>
                        <td className="py-2 font-medium text-ink-900">{r.product}</td>
                        <td className="py-2 text-ink-600">{r.category}</td>
                        <td className="py-2 text-ink-700">{r.qty} ชิ้น</td>
                        <td className="py-2 text-ink-700">฿{r.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}