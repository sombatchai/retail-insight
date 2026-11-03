import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../context/AnalysisContext.jsx";
// ============================================================
// แปลงวันที่ให้เป็น YYYY-MM
// รองรับ:
// - YYYY-MM-DD
// - ISO Date
// - Date object
// - Excel Serial Date
// - วันที่แบบ 5/13/20
// ============================================================
function normalizeYearMonth(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
  }

  const text = String(value).trim();

  if (!text) return null;

  // Excel Serial Date
  if (/^\d+(\.\d+)?$/.test(text)) {
    const serial = Number(text);

    if (serial > 20000 && serial < 100000) {
      const excelDate = new Date(
        Date.UTC(1899, 11, 30) + serial * 86400000
      );

      if (!isNaN(excelDate.getTime())) {
        return `${excelDate.getUTCFullYear()}-${String(
          excelDate.getUTCMonth() + 1
        ).padStart(2, "0")}`;
      }
    }
  }

  // YYYY-MM
  const yearMonth = text.match(/^(\d{4})-(\d{1,2})/);

  if (yearMonth) {
    return `${yearMonth[1]}-${String(Number(yearMonth[2])).padStart(2, "0")}`;
  }

  // YYYY/MM/DD
  const slashDate = text.match(
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})/
  );

  if (slashDate) {
    return `${slashDate[1]}-${String(Number(slashDate[2])).padStart(2, "0")}`;
  }

  // M/D/YY หรือ M/D/YYYY
  const mdY = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/
  );

  if (mdY) {
    let year = Number(mdY[3]);

    if (year < 100) {
      year += 2000;
    }

    return `${year}-${String(Number(mdY[1])).padStart(2, "0")}`;
  }

  // ISO / Date String
  const parsed = new Date(text);

  if (!isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(
      parsed.getMonth() + 1
    ).padStart(2, "0")}`;
  }

  return null;
}

// ============================================================
// ชื่อเดือนภาษาไทย
// ============================================================
function formatThaiMonth(yearMonth) {
  if (!yearMonth) return "-";

  const [year, month] = yearMonth.split("-").map(Number);

  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  return `${months[month - 1]} ${year + 543}`;
}

// ============================================================
// เพิ่มเดือน
// ============================================================
function addMonths(yearMonth, amount) {
  const [year, month] = yearMonth.split("-").map(Number);

  const date = new Date(year, month - 1 + amount, 1);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

// ============================================================
// Linear Regression
// Y = Intercept + Slope X
// ============================================================
function calculateRegression(monthlyData) {
  const n = monthlyData.length;

  if (n < 2) {
    return {
      slope: 0,
      intercept: monthlyData[0]?.actualDemand || 0,
    };
  }

  const x = monthlyData.map((_, index) => index + 1);
  const y = monthlyData.map((item) => item.actualDemand);

  const avgX = x.reduce((sum, value) => sum + value, 0) / n;
  const avgY = y.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - avgX) * (y[i] - avgY);
    denominator += Math.pow(x[i] - avgX, 2);
  }

  const slope =
    denominator !== 0 ? numerator / denominator : 0;

  const intercept = avgY - slope * avgX;

  return {
    slope,
    intercept,
  };
}

// ============================================================
// Forecast Page
// ============================================================
export default function ForecastPage() {
  const navigate = useNavigate();

  const { salesRecords, isLoading } = useAnalysis();

  // ==========================================================
  // เตรียมข้อมูล
  // ==========================================================
  const result = useMemo(() => {
    if (!Array.isArray(salesRecords) || salesRecords.length === 0) {
      return {
        monthlyData: [],
        slope: 0,
        intercept: 0,
        forecastNext: 0,
        futureForecasts: [],
      };
    }

    const monthlyMap = {};

    salesRecords.forEach((record) => {
      const month = normalizeYearMonth(record.date);

      if (!month) return;

      const qty = Number(record.qty) || 0;

      if (!monthlyMap[month]) {
        monthlyMap[month] = 0;
      }

      monthlyMap[month] += qty;
    });

    const sortedMonths = Object.keys(monthlyMap).sort();

    const monthlyData = sortedMonths.map(
      (month, index) => ({
        month,
        monthIndex: index + 1,
        actualDemand: monthlyMap[month],
      })
    );

    if (monthlyData.length < 2) {
      return {
        monthlyData,
        slope: 0,
        intercept: monthlyData[0]?.actualDemand || 0,
        forecastNext: 0,
        futureForecasts: [],
      };
    }

    const { slope, intercept } =
      calculateRegression(monthlyData);

    const historicalForecast = monthlyData.map(
      (item) => ({
        ...item,
        forecastDemand: Math.max(
          0,
          Math.round(
            intercept + slope * item.monthIndex
          )
        ),
      })
    );

    const lastIndex = monthlyData.length;

    const forecastNext = Math.max(
      0,
      Math.round(
        intercept + slope * (lastIndex + 1)
      )
    );

    const lastMonth =
      monthlyData[monthlyData.length - 1].month;

    const futureForecasts = [1, 2, 3].map(
      (offset) => {
        const monthIndex = lastIndex + offset;

        return {
          month: addMonths(lastMonth, offset),
          monthIndex,
          forecastDemand: Math.max(
            0,
            Math.round(
              intercept + slope * monthIndex
            )
          ),
        };
      }
    );

    return {
      monthlyData: historicalForecast,
      slope,
      intercept,
      forecastNext,
      futureForecasts,
    };
  }, [salesRecords]);

  // ==========================================================
  // Loading
  // ==========================================================
  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        กำลังดึงข้อมูลและคำนวณการพยากรณ์...
      </div>
    );
  }

  // ==========================================================
  // ไม่มีข้อมูล
  // ==========================================================
  if (!Array.isArray(salesRecords) || salesRecords.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            พยากรณ์ยอดขาย
          </h2>

          <p className="text-gray-500 mt-3">
            ยังไม่มีข้อมูลสำหรับการพยากรณ์
          </p>

          <button
            onClick={() => navigate("/data")}
            className="mt-6 px-5 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700"
          >
            ไปเพิ่มข้อมูล
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ข้อมูลไม่ถึง 2 เดือน
  // ==========================================================
  if (result.monthlyData.length < 2) {
    return (
      <div className="p-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            พยากรณ์ยอดขาย
          </h2>

          <p className="text-gray-500 mt-3">
            ต้องมีข้อมูลอย่างน้อย 2 เดือน
            เพื่อคำนวณ Linear Regression
          </p>
        </div>
      </div>
    );
  }

  const {
    monthlyData,
    slope,
    intercept,
    forecastNext,
    futureForecasts,
  } = result;

  const lastMonth =
    monthlyData[monthlyData.length - 1].month;

  const trendText =
    slope > 0
      ? "แนวโน้มยอดขายเพิ่มขึ้น"
      : slope < 0
      ? "แนวโน้มยอดขายลดลง"
      : "แนวโน้มยอดขายคงที่";

  // ==========================================================
  // Chart
  // ==========================================================
  const chartWidth = 900;
  const chartHeight = 320;

  const values = [
    ...monthlyData.map((item) => item.actualDemand),
    ...monthlyData.map((item) => item.forecastDemand),
    ...futureForecasts.map((item) => item.forecastDemand),
  ];

  const maxValue = Math.max(...values, 1);
  const minValue = 0;

  const allPoints = [
    ...monthlyData,
    ...futureForecasts.map((item) => ({
      ...item,
      actualDemand: null,
    })),
  ];

  const getX = (index) => {
    if (allPoints.length <= 1) return 50;

    return (
      50 +
      (index / (allPoints.length - 1)) *
        (chartWidth - 100)
    );
  };

  const getY = (value) => {
    return (
      chartHeight -
      40 -
      ((value - minValue) /
        (maxValue - minValue || 1)) *
        (chartHeight - 80)
    );
  };

  const actualPoints = monthlyData
    .map(
      (item, index) =>
        `${getX(index)},${getY(
          item.actualDemand
        )}`
    )
    .join(" ");

  const forecastPoints = [
    ...monthlyData,
    ...futureForecasts.map((item) => ({
      ...item,
      forecastDemand: item.forecastDemand,
    })),
  ]
    .map(
      (item, index) =>
        `${getX(index)},${getY(
          item.forecastDemand
        )}`
    )
    .join(" ");

  // ==========================================================
  // Render
  // ==========================================================
  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">

      {/* ======================================================
          Header
      ====================================================== */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          พยากรณ์ยอดขาย
        </h1>

        <p className="text-gray-500 mt-1">
          Linear Regression Forecast
        </p>
      </div>

      {/* ======================================================
          Forecast Demand
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <p className="text-sm text-gray-500">
          Forecast Demand
        </p>

        <p className="text-4xl font-bold text-purple-600 mt-2">
          {forecastNext.toLocaleString()} หน่วย
        </p>

        <p className="text-sm text-gray-500 mt-2">
          พยากรณ์สำหรับเดือนถัดไป
          {" "}
          <span className="font-semibold text-gray-700">
            {formatThaiMonth(
              futureForecasts[0]?.month
            )}
          </span>
        </p>
      </div>

      {/* ======================================================
          Regression Cards
      ====================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm text-gray-500">
            Slope
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-2">
            {slope >= 0 ? "+" : ""}
            {slope.toFixed(2)}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            ความชันของแนวโน้ม
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm text-gray-500">
            Intercept
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-2">
            {intercept.toFixed(2)}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            จุดตัดแกน Y
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm text-gray-500">
            ข้อมูลที่ใช้
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-2">
            {monthlyData.length} เดือน
          </p>

          <p className="text-xs text-gray-400 mt-1">
            จากข้อมูลทั้งหมด {salesRecords.length.toLocaleString()} รายการ
          </p>
        </div>

      </div>

      {/* ======================================================
          Regression Equation
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

        <h2 className="text-lg font-bold text-gray-800">
          สมการ Regression
        </h2>

        <div className="mt-4 bg-gray-50 rounded-xl p-5 text-center">

          <p className="text-xl md:text-2xl font-mono font-semibold text-gray-800">
            Y = {intercept.toFixed(2)}
            {" "}
            {slope >= 0 ? "+" : "-"}
            {" "}
            {Math.abs(slope).toFixed(2)}X
          </p>

          <p className="text-sm text-gray-500 mt-2">
            Y = Forecast Demand
            {" | "}
            X = Month Index
          </p>

        </div>

      </div>

      {/* ======================================================
          Chart
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              กราฟ Actual vs Forecast
            </h2>

            <p className="text-sm text-gray-500">
              เปรียบเทียบยอดขายจริงกับค่าที่แบบจำลองพยากรณ์
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">

          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full min-w-[700px]"
          >

            {/* Grid */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y =
                40 +
                (i / 4) *
                  (chartHeight - 80);

              return (
                <line
                  key={i}
                  x1="50"
                  x2={chartWidth - 50}
                  y1={y}
                  y2={y}
                  stroke="#e5e7eb"
                />
              );
            })}

            {/* Actual */}
            <polyline
              points={actualPoints}
              fill="none"
              stroke="#2563eb"
              strokeWidth="4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Forecast */}
            <polyline
              points={forecastPoints}
              fill="none"
              stroke="#9333ea"
              strokeWidth="3"
              strokeDasharray="8 6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Actual dots */}
            {monthlyData.map((item, index) => (
              <circle
                key={`actual-${item.month}`}
                cx={getX(index)}
                cy={getY(item.actualDemand)}
                r="5"
                fill="#2563eb"
              />
            ))}

            {/* Labels */}
            {allPoints.map((item, index) => (
              <text
                key={`label-${index}`}
                x={getX(index)}
                y={chartHeight - 12}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
              >
                {formatThaiMonth(item.month)}
              </text>
            ))}

          </svg>

        </div>

        <div className="flex justify-center gap-8 mt-4 text-sm">

          <div className="flex items-center gap-2">
            <span className="w-8 h-1 bg-blue-600 inline-block" />
            Actual Demand
          </div>

          <div className="flex items-center gap-2">
            <span className="w-8 h-1 bg-purple-600 inline-block" />
            Forecast Demand
          </div>

        </div>

      </div>

      {/* ======================================================
          Table
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

        <h2 className="text-lg font-bold text-gray-800 mb-4">
          ตาราง Actual Demand / Forecast Demand
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="text-left py-3 px-3">
                  เดือน
                </th>

                <th className="text-right py-3 px-3">
                  Month Index
                </th>

                <th className="text-right py-3 px-3">
                  Actual Demand
                </th>

                <th className="text-right py-3 px-3">
                  Forecast Demand
                </th>
              </tr>
            </thead>

            <tbody>

              {monthlyData.map((item) => (

                <tr
                  key={item.month}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >

                  <td className="py-3 px-3 font-medium text-gray-800">
                    {formatThaiMonth(item.month)}
                  </td>

                  <td className="py-3 px-3 text-right text-gray-600">
                    {item.monthIndex}
                  </td>

                  <td className="py-3 px-3 text-right">
                    {item.actualDemand.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-right font-semibold text-purple-600">
                    {item.forecastDemand.toLocaleString()}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* ======================================================
          Future Forecast
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

        <h2 className="text-lg font-bold text-gray-800">
          Forecast ล่วงหน้า 3 เดือน
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          ค่าพยากรณ์จากสมการ Linear Regression
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">

          {futureForecasts.map((item, index) => (

            <div
              key={item.month}
              className="rounded-xl bg-purple-50 border border-purple-100 p-5"
            >

              <p className="text-sm text-gray-500">
                เดือน +{index + 1}
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {formatThaiMonth(item.month)}
              </p>

              <p className="text-2xl font-bold text-purple-600 mt-3">
                {item.forecastDemand.toLocaleString()}
                {" "}
                หน่วย
              </p>

            </div>

          ))}

        </div>

      </div>

      {/* ======================================================
          Summary
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

        <h2 className="text-lg font-bold text-gray-800">
          สรุปแนวโน้มการขาย
        </h2>

        <div className="mt-4 bg-gray-50 rounded-xl p-5">

          <p className="text-lg font-semibold text-gray-800">
            {trendText}
          </p>

          <p className="text-sm text-gray-600 mt-2">
            จากค่า Slope เท่ากับ{" "}
            <span className="font-semibold">
              {slope.toFixed(2)}
            </span>
            {" "}
            หน่วยต่อเดือน
          </p>

          <p className="text-sm text-gray-600 mt-2">
            ข้อมูลล่าสุดคือ{" "}
            <span className="font-semibold">
              {formatThaiMonth(lastMonth)}
            </span>
            {" "}
            และแบบจำลองคาดการณ์เดือนถัดไปประมาณ{" "}
            <span className="font-semibold text-purple-600">
              {forecastNext.toLocaleString()} หน่วย
            </span>
          </p>

        </div>

      </div>

    </div>
  );
}