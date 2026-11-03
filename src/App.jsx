import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import SalesTrendPage from "./pages/SalesTrendPage.jsx";
import ForecastPage from "./pages/ForecastPage.jsx";
import AIInsightPage from "./pages/AIInsightPage.jsx";
import ProductListPage from "./pages/ProductListPage.jsx";
import DeadStockPage from "./pages/DeadStockPage.jsx";
import DataPage from "./pages/DataPage.jsx";
import { AnalysisProvider } from "./context/AnalysisContext.jsx"; 

export default function App() {
  return (
    <BrowserRouter>
      <AnalysisProvider> {/* นำมาครอบ Routes ตรงนี้ */}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/trends" element={<SalesTrendPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/ai-insight" element={<AIInsightPage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/dead-stock" element={<DeadStockPage />} />
            <Route path="/data" element={<DataPage />} />
          </Route>
        </Routes>
      </AnalysisProvider>
    </BrowserRouter>
  );
}