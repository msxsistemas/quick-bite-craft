import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import MenuPage from "./pages/MenuPage";
import CheckoutPage from "./pages/CheckoutPage";
import ResellerAuth from "./pages/ResellerAuth";
import RestaurantAdminLogin from "./pages/RestaurantAdminLogin";
import ResellerDashboard from "./pages/ResellerDashboard";
import ResellerRestaurantsPage from "./pages/reseller/ResellerRestaurantsPage";
import ResellerSubscriptionsPage from "./pages/reseller/ResellerSubscriptionsPage";
import ResellerReportsPage from "./pages/reseller/ResellerReportsPage";
import ResellerSettingsPage from "./pages/reseller/ResellerSettingsPage";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import PDVPage from "./pages/admin/PDVPage";
import KitchenPage from "./pages/admin/KitchenPage";
import WaitersPage from "./pages/admin/WaitersPage";
import WaiterAccessPage from "./pages/admin/WaiterAccessPage";
import OrdersPage from "./pages/admin/OrdersPage";
import ProductsPage from "./pages/admin/ProductsPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import ExtrasPage from "./pages/admin/ExtrasPage";
import CouponsPage from "./pages/admin/CouponsPage";
import DeliveryFeesPage from "./pages/admin/DeliveryFeesPage";
import HoursPage from "./pages/admin/HoursPage";
import SettingsPage from "./pages/admin/SettingsPage";
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
              <Route path="/r/:slug/checkout" element={<CheckoutPage />} />
              
              {/* Restaurant Admin */}
              <Route path="/r/:slug/admin" element={<RestaurantAdminLogin />} />
              <Route path="/r/:slug/admin/dashboard" element={<RestaurantDashboard />} />
              <Route path="/r/:slug/admin/pdv" element={<PDVPage />} />
              <Route path="/r/:slug/admin/kitchen" element={<KitchenPage />} />
              <Route path="/r/:slug/admin/waiters" element={<WaitersPage />} />
              <Route path="/r/:slug/admin/waiter-access" element={<WaiterAccessPage />} />
              <Route path="/r/:slug/admin/orders" element={<OrdersPage />} />
              <Route path="/r/:slug/admin/products" element={<ProductsPage />} />
              <Route path="/r/:slug/admin/categories" element={<CategoriesPage />} />
              <Route path="/r/:slug/admin/extras" element={<ExtrasPage />} />
              <Route path="/r/:slug/admin/coupons" element={<CouponsPage />} />
              <Route path="/r/:slug/admin/delivery-fees" element={<DeliveryFeesPage />} />
              <Route path="/r/:slug/admin/hours" element={<HoursPage />} />
              <Route path="/r/:slug/admin/settings" element={<SettingsPage />} />
              
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
              <Route 
                path="/reseller/restaurants" 
                element={
                  <ProtectedRoute requiredRole="reseller">
                    <ResellerRestaurantsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reseller/subscriptions" 
                element={
                  <ProtectedRoute requiredRole="reseller">
                    <ResellerSubscriptionsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reseller/reports" 
                element={
                  <ProtectedRoute requiredRole="reseller">
                    <ResellerReportsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reseller/settings" 
                element={
                  <ProtectedRoute requiredRole="reseller">
                    <ResellerSettingsPage />
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
