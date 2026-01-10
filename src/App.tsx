import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import MenuPage from "./pages/MenuPage";
import ResellerLogin from "./pages/ResellerLogin";
import RestaurantAdminLogin from "./pages/RestaurantAdminLogin";
import ResellerDashboard from "./pages/ResellerDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Restaurant Menu */}
            <Route path="/r/:slug" element={<MenuPage />} />
            
            {/* Restaurant Admin */}
            <Route path="/r/:slug/admin" element={<RestaurantAdminLogin />} />
            <Route path="/r/:slug/admin/dashboard" element={<RestaurantDashboard />} />
            
            {/* Reseller Admin */}
            <Route path="/reseller" element={<ResellerLogin />} />
            <Route path="/reseller/dashboard" element={<ResellerDashboard />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
