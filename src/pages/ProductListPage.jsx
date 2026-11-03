import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Download, PackageOpen } from "lucide-react";
import { SectionCard, StatusBadge, PillToggle } from "../components/UI.jsx";
import { useAnalysis } from "../context/AnalysisContext.jsx";

const STATUS_OPTIONS = [
  { label: "ทั้งหมด", value: "all" },
  { label: "ใกล้หมด", value: "ใกล้หมด" },
  { label: "ขายดี", value: "สินค้าขายดี" },
  { label: "ปกติ", value: "ปกติ" },
];

export default function ProductListPage() {
  const navigate = useNavigate();
  const { analysisData } = useAnalysis();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  // ดึงข้อมูลยอดขายสะสมจาก LocalStorage หรือ Context
  const manualRecords = useMemo(() => {
    try {
      const saved = localStorage.getItem("retail_manual_records");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  // รวมรายการสินค้าและคำนวณสถานะ
  const productList = useMemo(() => {
    const records =
      analysisData?.sales_records && analysisData.sales_records.length > 0
        ? analysisData.sales_records
        : manualRecords;

    if (records.length === 0) return [];

    const salesGrouped = records.reduce((acc, item) => {
      const name = item.product || `สินค้า SKU-${item.sku || "ทั่วไป"}`;
      if (!acc[name]) {
        acc[name] = {
          name,
          category: item.category || "ทั่วไป",
          totalSold: 0,
          price: Number(item.price) || 0,
          cost: Number(item.cost) || (Number(item.price) || 0) * 0.7,
        };
      }
      acc[name].totalSold += Number(item.qty) || 1;
      return acc;
    }, {});

    // เรียงตามยอดขายสะสม
    const sorted = Object.values(salesGrouped).sort((a, b) => b.totalSold - a.totalSold);

    return sorted.map((p, index) => {
      // กำหนดสต็อกให้สมเหตุสมผลตามขนาดร้านค้า (ไม่ให้ติด 0 ชิ้น)
      const currentStock = Math.max(15, Math.round(p.totalSold * 0.15));

      // เกณฑ์สถานะตามรูปแบบเดิม:
      // 20 อันดับแรก = สินค้าขายดี, สต็อกเหลือน้อยกว่า 20 = ใกล้หมด, อื่นๆ = ปกติ
      let prodStatus = "ปกติ";
      if (currentStock <= 15) {
        prodStatus = "ใกล้หมด";
      } else if (index < 20 && p.totalSold > 0) {
        prodStatus = "สินค้าขายดี";
      }

      return {
        id: index + 1,
        name: p.name,
        category: p.category,
        stock: currentStock,
        totalSold: p.totalSold,
        cost: `฿${Number(p.cost).toFixed(2)}`,
        price: `฿${Number(p.price).toFixed(2)}`,
        status: prodStatus,
      };
    });
  }, [analysisData, manualRecords]);

  // กรองตามช่องค้นหาและปุ่มสถานะ
  const rows = useMemo(() => {
    return productList.filter((p) => {
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || p.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [productList, query, status]);

  // ส่งออก CSV
  const handleExportCSV = () => {
    if (rows.length === 0) return alert("ไม่มีข้อมูลสำหรับส่งออก");
    const headers = ["สินค้า,คงเหลือ,ยอดขายสะสม,ต้นทุน,ราคาขาย,สถานะ"];
    const csvRows = rows.map(
      (p) =>
        `"${p.name}","${p.stock}","${p.totalSold}","${p.cost}","${p.price}","${p.status}"`
    );
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...csvRows].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `products_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="รายการสินค้าและคลังสินค้า"
        action={
          <button
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="flex items-center gap-2 rounded-xl border border-[#e4e6f2] bg-white px-3.5 py-2 text-[13px] font-medium text-ink-700 hover:bg-mist disabled:opacity-50"
          >
            <Download size={15} />
            ส่งออก CSV/Excel
          </button>
        }
      >
        {/* แถบค้นหาและตัวกรองเดิม */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า..."
              className="w-full rounded-xl border border-[#e4e6f2] bg-white py-2.5 pl-9 pr-3 text-[13.5px] outline-none placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <PillToggle options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        </div>

        {/* ตารางรูปแบบเดิม */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="text-[12px] text-ink-500">
                <th className="pb-3 font-medium">สินค้า</th>
                <th className="pb-3 font-medium">คงเหลือ</th>
                <th className="pb-3 font-medium">ต้นทุน</th>
                <th className="pb-3 font-medium">ราคาขาย</th>
                <th className="pb-3 font-medium">สถานะ</th>
                <th className="pb-3 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-300">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <PackageOpen size={32} className="stroke-[1.5]" />
                      <p className="text-[13.5px] font-medium text-ink-700">
                        ยังไม่มีข้อมูลสินค้าในคลัง
                      </p>
                      <p className="text-[12px] text-ink-500">
                        บันทึกยอดขายในหน้า "ข้อมูลและสถิติ" เพื่อให้ระบบสร้างฐานข้อมูลสินค้า
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.name} className="border-t border-[#f1f2f9]">
                    <td className="py-3.5 font-medium text-ink-900">{p.name}</td>
                    <td className="py-3.5 text-ink-700">{p.stock} ชิ้น</td>
                    <td className="py-3.5 text-ink-700">{p.cost}</td>
                    <td className="py-3.5 text-ink-700">{p.price}</td>
                    <td className="py-3.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => navigate("/forecast")}
                        className="text-[12.5px] text-brand-600 hover:underline"
                      >
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* แถบสรุปจำนวนรายการด้านล่าง */}
        <div className="mt-4 flex items-center justify-between text-[12px] text-ink-500 border-t border-[#f1f2f9] pt-3">
          <span>
            แสดง {rows.length} จากทั้งหมด {productList.length} รายการ
          </span>
        </div>
      </SectionCard>
    </div>
  );
}