import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Predictions from "./pages/Predictions";
import Equipment from "./pages/Equipment";
import Farms from "./pages/Farms";
import WorkOrders from "./pages/WorkOrders";
import Inventory from "./pages/Inventory";
import Analytics from "./pages/Analytics";
import EnhancedAnalytics from "./pages/EnhancedAnalytics";
import AIAnalyticsSimulation from "./pages/AIAnalyticsSimulation";
import HistoricalIntelligence from "./pages/HistoricalIntelligence";
import ReportHistory from "./pages/ReportHistory";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/farms" element={<Farms />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/analytics-enhanced" element={<EnhancedAnalytics />} />
          <Route path="/ai-analytics-simulation" element={<AIAnalyticsSimulation />} />
          <Route path="/reports" element={<Reports />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;