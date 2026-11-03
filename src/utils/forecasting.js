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
