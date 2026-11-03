import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Eye, EyeOff, BarChart3 } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_-15px_rgba(20,23,43,0.12)] lg:grid-cols-2">
        <div className="px-8 py-10 sm:px-12 sm:py-12">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <ShoppingBag size={20} />
            </span>
            <h1 className="text-lg font-semibold text-ink-900">
              Retail <span className="text-brand-600">Insight</span>
            </h1>
            <p className="mt-1 text-[13px] text-ink-500">Smart Analytics for Retail</p>
          </div>

          <p className="mb-6 text-center text-[13.5px] text-ink-500">
            เข้าสู่ระบบเพื่อใช้งาน
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-700">
                อีเมล
              </label>
              <input
                type="email"
                placeholder="example@retail.com"
                className="w-full rounded-xl border border-[#e4e6f2] bg-white px-4 py-2.5 text-[14px] text-ink-900 outline-none placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-700">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#e4e6f2] bg-white px-4 py-2.5 pr-11 text-[14px] text-ink-900 outline-none placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
                  aria-label="แสดงรหัสผ่าน"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[13px]">
              <label className="flex items-center gap-2 text-ink-500">
                <input type="checkbox" className="h-4 w-4 rounded border-[#d7d9ea] text-brand-600 focus:ring-brand-200" />
                จดจำฉันไว้
              </label>
              <button type="button" className="font-medium text-brand-600 hover:text-brand-700">
                ลืมรหัสผ่าน?
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-brand-600 py-3 text-[14px] font-medium text-white transition-colors hover:bg-brand-700"
            >
              เข้าสู่ระบบ
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-ink-500">
            ยังไม่มีบัญชี?{" "}
            <button className="font-medium text-brand-600 hover:text-brand-700">
              สมัครใช้งาน
            </button>
          </p>

          <p className="mt-8 text-center text-[11.5px] text-ink-300">
            © 2026 Retail Insight. All rights reserved.
          </p>
        </div>

        <div className="relative hidden items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50 lg:flex">
          <div className="relative flex h-64 w-64 items-center justify-center rounded-[28px] bg-white shadow-[0_20px_50px_-10px_rgba(67,97,247,0.25)]">
            <BarChart3 size={72} className="text-brand-500" strokeWidth={1.5} />
          </div>
          <span className="absolute bottom-10 left-10 h-16 w-16 rounded-full bg-brand-100" />
          <span className="absolute right-8 top-12 h-10 w-10 rounded-full bg-mint-50" />
        </div>
      </div>
    </div>
  );
}
