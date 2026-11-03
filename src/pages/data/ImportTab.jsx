import { useRef, useState } from "react";
import { UploadCloud, CheckCircle2, XCircle, Trash2, Download, Sparkles, Loader2 } from "lucide-react";
import { SectionCard } from "../../components/UI.jsx";
import { useAnalysis } from "../../context/AnalysisContext.jsx";

export default function ImportTab() {
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState([
    
  ]);
  const inputRef = useRef(null);

  const { uploadAndAnalyze, loadDemoData, isLoading, error } = useAnalysis();

  const handleFileProcess = async (file) => {
    if (!file) return;
    const result = await uploadAndAnalyze(file);

    const newEntry = {
      file: file.name,
      rows: result.success ? (result.data?.total_rows || 100) : 0,
      status: result.success ? "success" : "failed",
      date: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };
    setHistory((prev) => [newEntry, ...prev]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDemoLoad = async () => {
    const result = await loadDemoData();
    if (result.success) {
      setHistory((prev) => [
        { file: "Kaggle_Retail_Demo.csv", rows: 5000, status: "success", date: "ชุดข้อมูลสาธิต" },
        ...prev,
      ]);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard title="นำเข้าไฟล์ยอดขาย">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isLoading && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
            dragOver ? "border-brand-500 bg-brand-50" : "border-[#dde0f0] bg-mist"
          } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-500 shadow-sm">
            {isLoading ? <Loader2 size={24} className="animate-spin text-brand-600" /> : <UploadCloud size={22} />}
          </span>
          <p className="text-[14px] font-medium text-ink-900">
            {isLoading ? "กำลังประมวลผลและวิเคราะห์ข้อมูล..." : "ลากไฟล์มาวางที่นี่ หรือคลิกเพื่ออัปโหลด"}
          </p>
          <p className="mt-1 text-[12.5px] text-ink-500">
            รองรับไฟล์ .xlsx, .xls, .csv ขนาดไม่เกิน 10MB
          </p>
          <button
            type="button"
            disabled={isLoading}
            className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:bg-ink-300"
          >
            เลือกไฟล์
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleFileProcess(e.target.files?.[0])}
          />
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-[13px] text-rose-500">
            ❌ {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand-600 hover:text-brand-700"
          >
            <Download size={14} />
            ดาวน์โหลดไฟล์ตัวอย่าง (Template)
          </a>

          {/* ปุ่มโหลดชุดข้อมูล Kaggle Demo ตาม Feedback อาจารย์ */}
          <button
            type="button"
            onClick={handleDemoLoad}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-[12.5px] font-medium text-brand-700 hover:bg-brand-100"
          >
            <Sparkles size={14} />
            โหลดชุดข้อมูลตัวอย่างจริง (Kaggle Demo)
          </button>
        </div>
      </SectionCard>

      <SectionCard title="ประวัติการนำเข้าข้อมูล">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="text-[12px] text-ink-500">
              <th className="pb-3 font-medium">ไฟล์</th>
              <th className="pb-3 font-medium">จำนวนแถว</th>
              <th className="pb-3 font-medium">สถานะ</th>
              <th className="pb-3 font-medium">วันที่นำเข้า</th>
              <th className="pb-3 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody>
            {history.map((f, idx) => (
              <tr key={idx} className="border-t border-[#f1f2f9]">
                <td className="py-2.5 font-medium text-ink-900">{f.file}</td>
                <td className="py-2.5 text-ink-700">{f.rows.toLocaleString()}</td>
                <td className="py-2.5">
                  {f.status === "success" ? (
                    <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-mint-500">
                      <CheckCircle2 size={14} /> สำเร็จ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-rose-500">
                      <XCircle size={14} /> ผิดพลาด
                    </span>
                  )}
                </td>
                <td className="py-2.5 text-ink-700">{f.date}</td>
                <td className="py-2.5 text-right">
                  <button
                    onClick={() => setHistory(history.filter((_, i) => i !== idx))}
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
      </SectionCard>
    </div>
  );
}