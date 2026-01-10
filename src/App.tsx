import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import MenuPage from "./pages/MenuPage";
import ResellerAuth from "./pages/ResellerAuth";
import RestaurantAdminLogin from "./pages/RestaurantAdminLogin";
import ResellerDashboard from "./pages/ResellerDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
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
              <Route path="/reseller" element={<ResellerAuth />} />
              <Route 
                path="/reseller/dashboard" 
                element={
                  <ProtectedRoute requiredRole="reseller">
                    <ResellerDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
