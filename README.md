# Retail Insight

เว็บแอปพลิเคชันสำหรับวิเคราะห์ข้อมูลยอดขายร้านค้าปลีก ช่วยให้ดูภาพรวมยอดขาย แนวโน้ม การพยากรณ์ และสินค้าค้างสต๊อกได้ในที่เดียว

## ที่มาของโปรเจค

โปรเจคนี้เป็นส่วนหนึ่งของงานวิเคราะห์ข้อมูล (Data Analytics) ของกลุ่มนักศึกษา งานวิเคราะห์ ตัวชี้วัด และแนวคิดทางสถิติเป็นผลงานของทีมนักศึกษา Data Analytics

ส่วนเว็บแอป **Retail Insight** นี้ ผมเป็นผู้พัฒนาขึ้นเพื่ออำนวยความสะดวกให้กับโปรเจคดังกล่าว โดยนำผลการวิเคราะห์มาแสดงเป็นหน้าเว็บที่ใช้งานได้จริง ให้ผู้ใช้นำเข้าข้อมูลยอดขายแล้วเห็นผลลัพธ์ได้ทันทีโดยไม่ต้องเปิด Excel หรือ Power BI

| บทบาท | ผู้รับผิดชอบ |
| --- | --- |
| การวิเคราะห์ข้อมูล / โมเดลสถิติ | ทีมนักศึกษา Data Analytics |
| พัฒนาเว็บแอป (Frontend + Firebase) | [sombatchai](https://github.com/sombatchai) |

## ฟีเจอร์หลัก

- **ภาพรวม (Dashboard)** — ยอดขายรวม กำไร และกราฟสรุปตามช่วงเวลา 7 / 30 / 90 วัน
- **แนวโน้มยอดขาย** — ดูยอดขายรายวันและรายหมวดหมู่สินค้า
- **พยากรณ์ยอดขาย** — พยากรณ์ความต้องการสินค้าเดือนถัดไปด้วย Linear Regression (Y = Intercept + Slope × MonthIndex) พร้อมกราฟ Actual vs Forecast และค่าพยากรณ์ล่วงหน้า 3 เดือน
- **AI Insight** — จัดลำดับความเร่งด่วนในการสั่งซื้อสินค้า และคำแนะนำเชิงกลยุทธ์ (กระแสเงินสด, ROI, Safety Stock)
- **จัดการสินค้า** — รายการสินค้าพร้อมสถานะ (ขายดี / ปกติ / ใกล้หมด) และส่งออกเป็น CSV
- **Dead Stock** — ตรวจจับสินค้าค้างสต๊อกเกิน 30 / 60 / 90 วัน และคำนวณมูลค่าเงินจม
- **ข้อมูลและสถิติ**
  - นำเข้าไฟล์ `.xlsx`, `.xls`, `.csv`
  - ป้อนข้อมูลยอดขายด้วยตนเอง
  - สถิติเชิงพรรณนารายสินค้า เช่น Mean, Coefficient of Variation, Price Elasticity, Inventory Turnover

## เทคโนโลยีที่ใช้

- [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Recharts](https://recharts.org/) — กราฟ
- [Firebase Firestore](https://firebase.google.com/docs/firestore) — เก็บข้อมูลยอดขายแบบ Realtime
- [SheetJS (xlsx)](https://sheetjs.com/) และ [PapaParse](https://www.papaparse.com/) — อ่านไฟล์ Excel / CSV

## การติดตั้งและรันโปรเจค

ต้องมี Node.js เวอร์ชัน 20 ขึ้นไป

```bash
git clone https://github.com/sombatchai/retail-insight.git
cd retail-insight
npm install
```

สร้างไฟล์ `.env.local` ที่ root ของโปรเจค แล้วใส่ค่าจาก Firebase Console (Project settings → Your apps)

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

รันโหมดพัฒนา

```bash
npm run dev
```

แล้วเปิด http://localhost:5173

คำสั่งอื่น ๆ

| คำสั่ง | ใช้ทำอะไร |
| --- | --- |
| `npm run build` | Build สำหรับ production (ผลลัพธ์อยู่ใน `dist/`) |
| `npm run preview` | เปิดดูผลลัพธ์ที่ build แล้ว |
| `npm run lint` | ตรวจโค้ดด้วย oxlint |

> หมายเหตุ: หน้า AI Insight เรียก API ที่ `http://localhost:8000/generate-ai-insight` ต้องรัน backend แยกต่างหาก ถ้าไม่ได้รัน หน้าอื่นยังใช้งานได้ตามปกติ

## โครงสร้างโปรเจค

```
src/
├── components/   ส่วนประกอบ UI (Sidebar, Topbar, Layout, Card)
├── context/      AnalysisContext — ดึงข้อมูลยอดขายจาก Firestore
├── data/         ไฟล์ข้อมูลตัวอย่างและ mock data
├── pages/        หน้าต่าง ๆ ของแอป
├── utils/        ฟังก์ชันคำนวณ เช่น forecasting
├── firebase.js   ตั้งค่า Firebase
└── index.css     Tailwind + ธีมสี
```

## Deploy

โปรเจคนี้ deploy บน [Vercel](https://vercel.com/) โดยต้องตั้งค่า Environment Variables `VITE_FIREBASE_*` ทั้งหมดใน Vercel ก่อน build
