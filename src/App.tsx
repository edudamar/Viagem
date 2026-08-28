import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import ItineraryPage from "@/pages/ItineraryPage";
import FinancesPage from "@/pages/FinancesPage";
import ChecklistPage from "@/pages/ChecklistPage";
import SettingsPage from "@/pages/SettingsPage";
import ReportsPage from "@/pages/ReportsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/:id" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="itinerario" element={<ItineraryPage />} />
        <Route path="financas" element={<FinancesPage />} />
        <Route path="checklist" element={<ChecklistPage />} />
        <Route path="config" element={<SettingsPage />} />
        <Route path="relatorios" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
