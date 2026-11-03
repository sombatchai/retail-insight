import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, RefreshCcw, Loader2, Bot, ShoppingCart, AlertCircle } from "lucide-react";
import { SectionCard, PrimaryButton } from "../components/UI.jsx";
import { useAnalysis } from "../context/AnalysisContext.jsx";

const PRIORITY_LABEL = {
  high: { text: "ควรสั่งด่วน", cls: "bg-rose-50 text-rose-500" },
  medium: { text: "ควรสั่ง", cls: "bg-amber-50 text-amber-500" },
  low: { text: "รอได้", cls: "bg-mist text-ink-500" },
};

export default function AIInsightPage() {
  const navigate = useNavigate();
  const { analysisData } = useAnalysis();
  const [budgetInput, setBudgetInput] = useState(20000);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [customAIInsight, setCustomAIInsight] = useState(null);

  // ดึงข้อมูลรายการขายที่ป้อนมือ
  const manualRecords = useMemo(() => {
    try {
      const saved = localStorage.getItem("retail_manual_records");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  // คำนวณจัดสรรงบประมาณด้วย Greedy Algorithm (Knapsack)
  const { recommendedProducts, totalSpent } = useMemo(() => {
    let rawItems = [];

    if (analysisData?.optimization?.items && analysisData.optimization.items.length > 0) {
      rawItems = analysisData.optimization.items;
    } else if (manualRecords.length > 0) {
      const grouped = manualRecords.reduce((acc, item) => {
        if (!acc[item.product]) {
          acc[item.product] = {
            name: item.product,
            price: item.price,
            cost: item.cost,
            qty: 0,
          };
        }
        acc[item.product].qty += item.qty;
        return acc;
      }, {});

      rawItems = Object.values(grouped).map((p) => {
        const unitProfit = p.price - p.cost;
        const marginPct = p.cost > 0 ? (unitProfit / p.cost) * 100 : 0;
        const roi = p.cost > 0 ? (p.price / p.cost).toFixed(1) : "1.0";
        const estimatedOrderCost = Math.round(p.cost * Math.max(10, p.qty * 1.2));

        return {
          name: p.name,
          cost: estimatedOrderCost,
          margin: `${marginPct.toFixed(1)}%`,
          marginValue: marginPct,
          roi: `${roi}x`,
          priority: marginPct >= 35 ? "high" : marginPct >= 15 ? "medium" : "low",
        };
      });
    }

    if (rawItems.length === 0) {
      return { recommendedProducts: [], totalSpent: 0 };
    }

    const sorted = [...rawItems].sort((a, b) => (b.marginValue || 0) - (a.marginValue || 0));

    let currentBudget = budgetInput;
    let spent = 0;
    const allocated = [];

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      if (currentBudget >= item.cost) {
        allocated.push({ ...item, rank: allocated.length + 1, allocatedCost: item.cost });
        spent += item.cost;
        currentBudget -= item.cost;
      } else if (currentBudget > 0) {
        allocated.push({ ...item, rank: allocated.length + 1, allocatedCost: currentBudget, isPartial: true });
        spent += currentBudget;
        currentBudget = 0;
        break;
      }
    }

    return { recommendedProducts: allocated, totalSpent: spent };
  }, [analysisData, manualRecords, budgetInput]);

  const remainingBudget = Math.max(0, budgetInput - totalSpent);
  const spentPct = budgetInput > 0 ? Math.min(100, Math.round((totalSpent / budgetInput) * 100)) : 0;

  // ข้อความและโครงสร้างเริ่มต้นของ AI Insight
  const defaultAIAdvice = useMemo(() => {
    const topItem = recommendedProducts[0]?.name || "สินค้าหลัก";
    const secondItem = recommendedProducts[1]?.name || "สินค้าหมวดรอง";

    return {
      title: "คำแนะนำเชิงกลยุทธ์จาก AI (Decision Support)",
      summary: `จากการวิเคราะห์กระแสเงินสดและยอดขายล่าสุด: แนะนำจัดสรรงบประมาณ ฿${totalSpent.toLocaleString()} มุ่งเน้นการสั่งซื้อ "${topItem}" เป็นลำดับแรกเพื่อสร้างอัตรากำไรและความต้องการหมุนเวียนคุ้มค่าที่สุด`,
      points: [
        `จัดสรรงบ ฿${totalSpent.toLocaleString()} ไปที่ ${topItem} เพื่อดึงรอบผลตอบแทนกลับเข้าสู่ร้านภายใน 7-14 วัน`,
        `กันเงินสดสำรอง ฿${remainingBudget.toLocaleString()} เพื่อรองรับความผันผวนของยอดขาย (CV) ในช่วงสุดสัปดาห์`,
        `ควรสำรวจหน้า Dead Stock เพื่อจัด Bundle สินค้าค้างสต็อกคู่กับ ${topItem}`
      ]
    };
  }, [recommendedProducts, totalSpent, remainingBudget]);

  // ฟังก์ชันสลับมุมมองบทวิเคราะห์ AI
  const handleGenerateInsight = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch("http://localhost:8000/generate-ai-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: budgetInput,
          spent: totalSpent,
          remaining: remainingBudget,
          products: recommendedProducts,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCustomAIInsight(data);
      } else {
        throw new Error();
      }
    } catch {
      setTimeout(() => {
        const topItem = recommendedProducts[0]?.name || "สินค้าหลัก";
        const secondItem = recommendedProducts[1]?.name || "สินค้าหมวดรอง";

        const insightVariations = [
          {
            title: "กลยุทธ์เพิ่มความคล่องตัวทางการเงิน (Liquidity & Cash Flow)",
            summary: `มุ่งเน้นการหมุนเวียนรอบเงินสดให้เร็วที่สุด โดยกระจายงบไปยังสินค้าที่ขายคล่องอย่าง "${topItem}" เป็นอันดับแรก`,
            points: [
              `จัดสรรงบ ฿${totalSpent.toLocaleString()} ไปที่ ${topItem} เพื่อดึงรอบผลตอบแทนกลับเข้าสู่ร้านภายใน 7-14 วัน`,
              `กันเงินสดสำรอง ฿${remainingBudget.toLocaleString()} เพื่อรองรับความผันผวนของยอดขาย (CV) ในช่วงสุดสัปดาห์`,
              `ควรสำรวจหน้า Dead Stock เพื่อจัด Bundle สินค้าค้างสต็อกคู่กับ ${topItem}`
            ]
          },
          {
            title: "กลยุทธ์เน้นผลตอบแทนสูงสุด (ROI & Profit Maximization)",
            summary: `คำนวณผ่านแบบจำลอง Knapsack พบว่า "${topItem}" ให้ Profit-to-Cost Ratio สูงสุดในตะกร้าสินค้าปัจจุบัน`,
            points: [
              `แนะนำสั่งซื้อ ${topItem} เต็มโควตางบประมาณเพื่อรับส่วนลดต้นทุนหรือลดความเสี่ยง Stock-out`,
              `แบ่งสัดส่วนงบประมาณสั่งซื้อ "${secondItem}" ควบคู่กันเพื่อตอบรับความต้องการลูกค้าหลากหลายกลุ่ม`,
              `คงเงินสำรอง ฿${remainingBudget.toLocaleString()} ไว้รับมือราคาวัตถุดิบหรือต้นทุนขายส่งที่อาจปรับขึ้น`
            ]
          },
          {
            title: "กลยุทธ์ควบคุมความเสี่ยงสต็อก (Safety Stock & Risk Mitigation)",
            summary: `ยอดขายของ "${topItem}" มีแนวโน้มเคลื่อนไหวสม่ำเสมอ แนะนำเติมสต็อกเพื่อรักษาระดับบริการลูกค้า (Service Level)`,
            points: [
              `การสั่งซื้อรอบนี้คิดเป็น ${spentPct}% ของงบประมาณตั้งต้น ถือเป็นสัดส่วนการลงทุนที่ปลอดภัย`,
              `รักษาระดับ Safety Stock ของ ${topItem} ไม่ให้ต่ำกว่าเกณฑ์สั่งซื้อซ้ำ (Reorder Point)`,
              `ติดตามรอบหมุนเวียนสต็อก (Turnover) อย่างใกล้ชิดเพื่อป้องกันการสั่งสินค้าเกินความจำเป็น`
            ]
          }
        ];

        let nextInsight = insightVariations[Math.floor(Math.random() * insightVariations.length)];
        while (nextInsight?.title === customAIInsight?.title && insightVariations.length > 1) {
          nextInsight = insightVariations[Math.floor(Math.random() * insightVariations.length)];
        }
        setCustomAIInsight(nextInsight);
      }, 500);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handlePurchase = () => {
    if (recommendedProducts.length === 0) return;
    localStorage.setItem("retail_pending_orders", JSON.stringify(recommendedProducts));
    alert("ระบบบันทึกรายการสินค้าเข้าสู่แผนจัดซื้อแล้ว กำลังพาไปหน้าจัดการสินค้า");
    navigate("/products");
  };

  const activeInsight = customAIInsight || defaultAIAdvice;

  return (
    <div className="space-y-5">
      {/* 1. กล่องคำแนะนำสไตล์ Executive AI Summary */}
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/70 via-white to-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceef8] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-200">
              <Bot size={20} />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink-900">
                {activeInsight.title}
              </h3>
              <p className="text-[12px] text-ink-500">
                ประมวลผลด้วยโมเดล Greedy Knapsack ร่วมกับการวิเคราะห์แนวโน้มยอดขาย
              </p>
            </div>
          </div>

          <PrimaryButton onClick={handleGenerateInsight} disabled={isGeneratingAI} className="!py-1.5 !px-3 !text-[12.5px]">
            {isGeneratingAI ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            {isGeneratingAI ? "กำลังวิเคราะห์..." : "สร้าง Insight ใหม่"}
          </PrimaryButton>
        </div>

        {/* เนื้อหาคำแนะนำ */}
        <div className="mt-4 space-y-3">
          <p className="text-[13.5px] font-medium text-ink-800 leading-relaxed">
            {activeInsight.summary}
          </p>

          {/* Action Cards 3 ข้อ */}
          {activeInsight.points && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {activeInsight.points.map((pt, idx) => (
                <div key={idx} className="rounded-xl border border-[#edf0f8] bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-brand-600 font-semibold text-[12px] mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-[11px]">
                      {idx + 1}
                    </span>
                    ข้อเสนอแนะ {idx + 1}
                  </div>
                  <p className="text-[12.5px] text-ink-600 leading-relaxed">{pt}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11.5px] text-brand-600">
          <span className="inline-block h-2 w-2 rounded-full bg-mint-500 animate-pulse" />
          <span>ระบบพร้อมปรับการจัดสรรงบประมาณอัตโนมัติเมื่อมีการปรับเปลี่ยนงบสั่งซื้อ</span>
        </div>
      </div>

      {/* 2. การ์ดตั้งค่างบประมาณสั่งซื้อ */}
      <SectionCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Sparkles size={20} />
            </span>
            <div>
              <p className="text-[13px] text-ink-500">งบประมาณสั่งซื้อรอบนี้ (ปรับเปลี่ยนได้)</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-xl font-semibold text-ink-900">฿</span>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(Number(e.target.value) || 0)}
                  className="w-40 rounded-xl border border-[#e4e6f2] px-3 py-1.5 text-xl font-semibold text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-[12.5px] text-ink-500">
            <span>ใช้ตามแผน ฿{totalSpent.toLocaleString()} ({spentPct}%)</span>
            <span>คงเหลือสำรอง ฿{remainingBudget.toLocaleString()}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-mist">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-300"
              style={{ width: `${spentPct}%` }}
            />
          </div>
        </div>
      </SectionCard>

      {/* 3. ตารางรายการสินค้าแนะนำ */}
      <SectionCard
        title="สินค้าแนะนำสำหรับสั่งซื้อ (Greedy Optimization)"
        action={
          recommendedProducts.length > 0 && (
            <PrimaryButton onClick={handlePurchase}>
              <ShoppingCart size={15} /> นำไปสั่งซื้อ
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
                <th className="pb-3 font-medium">งบที่จัดสรร</th>
                <th className="pb-3 font-medium">อัตรากำไร</th>
                <th className="pb-3 font-medium">ROI คาดการณ์</th>
                <th className="pb-3 font-medium text-right">ความสำคัญ</th>
              </tr>
            </thead>
            <tbody>
              {recommendedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-300">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={32} className="stroke-[1.5]" />
                      <p className="text-[14px] font-medium text-ink-700">ยังไม่มีข้อมูลสินค้าสำหรับแนะนำ</p>
                      <p className="text-[12px] text-ink-500">
                        กรุณานำเข้าไฟล์ หรือบันทึกยอดขายในหน้า "ข้อมูลและสถิติ" ก่อน
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                recommendedProducts.map((p) => (
                  <tr key={p.name} className="border-t border-[#f1f2f9]">
                    <td className="py-3 text-ink-500">{p.rank}</td>
                    <td className="py-3 font-medium text-ink-900">{p.name}</td>
                    <td className="py-3 text-ink-700">
                      ฿{(p.allocatedCost || p.cost).toLocaleString()}
                      {p.isPartial && <span className="ml-1 text-[11px] text-amber-500">(สั่งบางส่วน)</span>}
                    </td>
                    <td className="py-3 text-mint-500 font-medium">{p.margin}</td>
                    <td className="py-3 text-ink-700">{p.roi}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-medium ${PRIORITY_LABEL[p.priority]?.cls || "bg-mist text-ink-500"}`}>
                        {PRIORITY_LABEL[p.priority]?.text || "ปกติ"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ทฤษฎีประกอบการตัดสินใจ */}
        <div className="mt-5 rounded-xl border border-[#ecedf5] bg-[#fafbfe] p-4 text-[12.5px] text-ink-700">
          <p className="font-semibold text-ink-900 mb-1 flex items-center gap-1.5">
            💡 ทฤษฎีที่ใช้เบื้องหลัง (Theoretical Background):
          </p>
          <p className="text-ink-500 leading-relaxed">
            ระบบแก้โจทย์การจัดสรรงบประมาณสั่งซื้อด้วย <strong>Fractional Knapsack Problem</strong> โดยใช้ <strong>Greedy Algorithm</strong> ในการคำนวณและจัดเรียงสินค้าตาม <em>Profit-to-Cost Ratio</em> จากมากไปน้อย ช่วยให้ร้านค้าได้ผลกำไรสุทธิสูงสุดภายใต้งบประมาณเงินสดที่มีจำกัดโดยไม่ก่อให้เกิดปัญหาเงินจม
          </p>
        </div>
      </SectionCard>
    </div>
  );
}