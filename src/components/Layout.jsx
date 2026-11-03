import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

const TITLES = {
  "/": "ภาพรวมร้านค้าของคุณ",
  "/trends": "แนวโน้มและการวิเคราะห์",
  "/forecast": "พยากรณ์ยอดขาย",
  "/ai-insight": "คำแนะนำสั่งซื้อจาก AI",
  "/products": "จัดการสินค้าและคลังสินค้า",
  "/dead-stock": "สินค้าเสี่ยง Dead Stock",
  "/data": "ข้อมูลและสถิติ",
};

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />

      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar title={TITLES[pathname] ?? "Retail Insight"} onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 px-5 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
