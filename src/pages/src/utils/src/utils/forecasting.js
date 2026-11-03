export function calculateForecast(salesRecords) {
  if (!salesRecords || salesRecords.length === 0) {
    return { slope: 0, intercept: 0, forecasts: [], nextMonthForecast: 0 };
  }

  // 1. รวบรวมยอดขายแยกตามเดือน
  const monthlyData = {};
  salesRecords.forEach((r) => {
    const monthKey = r.date ? r.date.substring(0, 7) : "Unassigned";
    const qty = Number(r.qty) || 0;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + qty;
  });

  const sortedMonths = Object.keys(monthlyData).sort();
  const dataPoints = sortedMonths.map((month, index) => ({
    monthIndex: index + 1,
    monthName: month,
    actualDemand: monthlyData[month],
  }));

  const n = dataPoints.length;
  if (n < 2) {
    return { slope: 0, intercept: dataPoints[0]?.actualDemand || 0, forecasts: [], nextMonthForecast: 0 };
  }

  // 2. คำนวณ Slope และ Intercept ตามสูตร DAX
  const avgX = dataPoints.reduce((sum, p) => sum + p.monthIndex, 0) / n;
  const avgY = dataPoints.reduce((sum, p) => sum + p.actualDemand, 0) / n;

  let numerator = 0;
  let denominator = 0;

  dataPoints.forEach((p) => {
    numerator += (p.monthIndex - avgX) * (p.actualDemand - avgY);
    denominator += Math.pow(p.monthIndex - avgX, 2);
  });

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = avgY - slope * avgX;

  // 3. คำนวณ Forecast Demand = Intercept + (Slope * MonthIndex)
  const forecasts = dataPoints.map((p) => ({
    ...p,
    forecastDemand: Math.max(0, Math.round(intercept + slope * p.monthIndex)),
  }));

  const nextMonthForecast = Math.max(0, Math.round(intercept + slope * (n + 1)));

  return {
    slope: +slope.toFixed(2),
    intercept: +intercept.toFixed(2),
    forecasts,
    nextMonthForecast,
  };
}
import { useMemo } from "react";
import { useAnalysis } from "../context/AnalysisContext.jsx";
import { calculateForecast } from "../utils/forecasting.js";

export default function ForecastPage() {
  const { salesRecords, isLoading } = useAnalysis();

  const { slope, intercept, forecasts, nextMonthForecast } = useMemo(() => {
    return calculateForecast(salesRecords);
  }, [salesRecords]);

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">กำลังดึงข้อมูลและคำนวณการพยากรณ์...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-bold text-gray-800">การพยากรณ์ความต้องการสินค้า (Demand Forecasting)</h2>

      {/* บล็อกแสดงค่าพารามิเตอร์ Regression */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Regression Slope (ความชัน)</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{slope}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Regression Intercept (จุดตัดแกน Y)</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{intercept}</p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-xs">
          <p className="text-xs text-blue-600 font-medium">พยากรณ์ความต้องการงวดถัดไป</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{nextMonthForecast} ชิ้น</p>
        </div>
      </div>

      {/* ตารางเปรียบเทียบยอดขายจริง vs ยอดขายพยากรณ์ */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">เปรียบเทียบ Demand จริง กับ Forecast Demand</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500 text-xs">
                <th className="pb-2">Month Index (X)</th>
                <th className="pb-2">เดือน</th>
                <th className="pb-2">Demand จริง (Y)</th>
                <th className="pb-2 text-right">Forecast Demand</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((f) => (
                <tr key={f.monthIndex} className="border-b last:border-none hover:bg-gray-50">
                  <td className="py-2.5 text-gray-600">{f.monthIndex}</td>
                  <td className="py-2.5 font-medium text-gray-800">{f.monthName}</td>
                  <td className="py-2.5 text-gray-700">{f.actualDemand} ชิ้น</td>
                  <td className="py-2.5 text-right font-semibold text-blue-600">{f.forecastDemand} ชิ้น</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
