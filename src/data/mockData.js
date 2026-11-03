// Centralized mock data — swap for real API calls later.

export const salesTrend7d = [
  { label: "จ.", value: 9800 },
  { label: "อ.", value: 11200 },
  { label: "พ.", value: 10100 },
  { label: "พฤ.", value: 13400 },
  { label: "ศ.", value: 15800 },
  { label: "ส.", value: 18900 },
  { label: "อา.", value: 16620 },
];

export const overviewStats = [
  {
    label: "ยอดขายรวม",
    value: "฿85,420",
    delta: "+12.5%",
    trend: "up",
    icon: "wallet",
  },
  {
    label: "กำไรสุทธิ",
    value: "฿21,350",
    delta: "+8.4%",
    trend: "up",
    icon: "coins",
  },
  {
    label: "จำนวนบิล",
    value: "1,248",
    delta: "+3.1%",
    trend: "up",
    icon: "receipt",
  },
  {
    label: "มูลค่าเฉลี่ย/บิล",
    value: "฿8,900",
    delta: "-1.9%",
    trend: "down",
    icon: "trending-down",
  },
];

export const deadStockAlerts = {
  count: 5,
  value: "฿8,900",
};

export const lowStockAlerts = {
  count: 8,
  note: "ควรสั่งซื้อภายในสัปดาห์นี้",
};

export const topProducts = [
  { rank: 1, name: "Coca Cola 500ml", qty: 320, revenue: "$4,300", trend: "up" },
  { rank: 2, name: "Pepsi 500ml", qty: 280, revenue: "$4,200", trend: "up" },
  { rank: 3, name: "น้ำดื่ม 600ml", qty: 250, revenue: "$1,900", trend: "down" },
  { rank: 4, name: "ขนมปัง A", qty: 210, revenue: "$1,680", trend: "up" },
  { rank: 5, name: "โจ๊กกึ่งสำเร็จรูป", qty: 180, revenue: "$1,260", trend: "down" },
];

export const peakSalesTime = [
  { hour: "08:00", value: 20 },
  { hour: "10:00", value: 35 },
  { hour: "12:00", value: 78 },
  { hour: "14:00", value: 52 },
  { hour: "16:00", value: 44 },
  { hour: "18:00", value: 90 },
  { hour: "20:00", value: 68 },
];

export const statReliability = [
  { label: "Coefficient of Variation", value: "51.2%" },
  { label: "Median Sold", value: "$1,380" },
  { label: "Std Deviation", value: "$640" },
  { label: "Price Elasticity", value: "-0.72" },
];

export const salesByCategoryDonut = [
  { name: "เครื่องดื่ม", value: 40, color: "var(--color-brand-500)" },
  { name: "ขนม", value: 25, color: "var(--color-mint-500)" },
  { name: "ของใช้", value: 20, color: "var(--color-amber-500)" },
  { name: "อื่นๆ", value: 15, color: "var(--color-rose-500)" },
];

export const bestSellers = [
  { rank: 1, name: "Coca-Cola 500ml", qty: 320 },
  { rank: 2, name: "Pepsi 500ml", qty: 280 },
];

export const slowSellers = [
  { rank: 1, name: "น้ำดื่ม A", qty: 12 },
  { rank: 2, name: "ขนมปัง B", qty: 9 },
];

export const forecastActualVsPredicted = [
  { label: "1 พ.ย.", actual: 210, forecast: 205 },
  { label: "5 พ.ย.", actual: 240, forecast: 230 },
  { label: "10 พ.ย.", actual: 190, forecast: 210 },
  { label: "15 พ.ย.", actual: 260, forecast: 245 },
  { label: "20 พ.ย.", actual: 300, forecast: 275 },
  { label: "25 พ.ย.", actual: 280, forecast: 290 },
  { label: "30 พ.ย.", actual: null, forecast: 305 },
];

export const forecastLeaderboard = [
  { rank: 1, model: "Random Forest", mae: 12.6, badge: "gold" },
  { rank: 2, model: "Exponential Smoothing", mae: 14.1, badge: "silver" },
  { rank: 3, model: "Polynomial Regression", mae: 15.8, badge: "bronze" },
  { rank: 4, model: "Moving Average", mae: 18.3 },
  { rank: 5, model: "Linear Regression", mae: 21.4 },
];

export const forecastSummary = {
  product: "Coca Cola 500ml",
  bestModel: "Random Forest",
  mae: 12.6,
  predictedTotal: "246 ชิ้น",
  predictedRevenue: "฿7,350",
  confidence: "87%",
};

export const aiInsightBudget = {
  budget: 20000,
  spent: 16500,
  spentPct: 82.5,
  remaining: 3500,
};

export const aiInsightProducts = [
  {
    rank: 1,
    name: "Coca Cola 500ml",
    cost: "฿5,240",
    margin: "28.3%",
    roi: "3.1x",
    priority: "high",
  },
  {
    rank: 2,
    name: "Pepsi 500ml",
    cost: "฿4,120",
    margin: "24.1%",
    roi: "2.6x",
    priority: "high",
  },
  {
    rank: 3,
    name: "น้ำดื่ม 600ml",
    cost: "฿2,300",
    margin: "18.4%",
    roi: "1.8x",
    priority: "medium",
  },
  {
    rank: 4,
    name: "ขนมปัง A",
    cost: "฿1,900",
    margin: "15.2%",
    roi: "1.5x",
    priority: "medium",
  },
  {
    rank: 5,
    name: "โจ๊กกึ่งสำเร็จรูป",
    cost: "฿1,600",
    margin: "12.0%",
    roi: "1.2x",
    priority: "low",
  },
];

export const productList = [
  { name: "Coca Cola 500ml", stock: 320, cost: "฿12", price: "฿20", status: "ปกติ" },
  { name: "Pepsi 500ml", stock: 15, cost: "฿11", price: "฿20", status: "ใกล้หมด" },
  { name: "น้ำดื่ม 600ml", stock: 8, cost: "฿5", price: "฿10", status: "ใกล้หมด" },
  { name: "ขนมปังกรอบ A", stock: 90, cost: "฿15", price: "฿25", status: "ปกติ" },
  { name: "ลูกอมแฮง A", stock: 210, cost: "฿6", price: "฿12", status: "สินค้าขายดี" },
  { name: "ลูกอมแฮง B", stock: 4, cost: "฿6", price: "฿12", status: "ใกล้หมด" },
  { name: "ขนมข้าว C", stock: 5, cost: "฿9", price: "฿18", status: "ใกล้หมด" },
];

export const deadStockList = [
  { name: "ขนม A", lastSold: "15 มี.ค. 2566", daysIdle: 180, value: "฿1,200" },
  { name: "ขนม B", lastSold: "3 เม.ย. 2566", daysIdle: 150, value: "฿1,800" },
  { name: "น้ำอัดลม C", lastSold: "20 เม.ย. 2566", daysIdle: 140, value: "฿2,100" },
  { name: "ขนมปัง D", lastSold: "2 พ.ค. 2566", daysIdle: 120, value: "฿1,500" },
  { name: "ลูกอม E", lastSold: "10 พ.ค. 2566", daysIdle: 110, value: "฿2,300" },
];

export const importHistory = [
  { file: "sales_2509.xlsx", rows: 5240, status: "success", date: "5 ก.ย. 2568 14:30" },
  { file: "sales_2508.xlsx", rows: 4980, status: "success", date: "1 ส.ค. 2568 09:15" },
  { file: "sales_2507.csv", rows: 3120, status: "error", date: "3 ก.ค. 2568 18:02" },
];
