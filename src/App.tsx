import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import { RestaurantAdminProvider } from "@/hooks/useRestaurantAdmin";
import Index from "./pages/Index";
import MenuPage from "./pages/MenuPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import ResellerAuth from "./pages/ResellerAuth";
import RestaurantAdminLogin from "./pages/RestaurantAdminLogin";
import ResellerDashboard from "./pages/ResellerDashboard";
import ResellerRestaurantsPage from "./pages/reseller/ResellerRestaurantsPage";
import RestaurantDetailsPage from "./pages/reseller/RestaurantDetailsPage";
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
import LoyaltyPage from "./pages/admin/LoyaltyPage";
import WhatsAppPage from "./pages/admin/WhatsAppPage";
import SuggestionsPage from "./pages/admin/SuggestionsPage";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RestaurantProtectedRoute } from "./components/auth/RestaurantProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RestaurantAdminProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                
                {/* Restaurant Menu */}
                <Route path="/r/:slug" element={<MenuPage />} />
                <Route path="/r/:slug/order" element={<OrderTrackingPage />} />
                <Route path="/r/:slug/orders" element={<OrderHistoryPage />} />
                <Route path="/r/:slug/checkout" element={<CheckoutPage />} />
                
                {/* Restaurant Admin - Login */}
                <Route path="/r/:slug/admin" element={<RestaurantAdminLogin />} />
                <Route path="/r/:slug/admin/login" element={<RestaurantAdminLogin />} />
                
                {/* Restaurant Admin - Protected Routes */}
                <Route path="/r/:slug/admin/dashboard" element={
                  <RestaurantProtectedRoute><RestaurantDashboard /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/pdv" element={
                  <RestaurantProtectedRoute><PDVPage /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/kitchen" element={
                  <RestaurantProtectedRoute><KitchenPage /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/waiters" element={
                  <RestaurantProtectedRoute><WaitersPage /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/waiter-access" element={
                  <RestaurantProtectedRoute><WaiterAccessPage /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/orders" element={
                  <RestaurantProtectedRoute><OrdersPage /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/products" element={
                  <RestaurantProtectedRoute><ProductsPage /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/categories" element={
                  <RestaurantProtectedRoute><CategoriesPage /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/extras" element={
                  <RestaurantProtectedRoute><ExtrasPage /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/coupons" element={
                  <RestaurantProtectedRoute><CouponsPage /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/delivery-fees" element={
                  <RestaurantProtectedRoute><DeliveryFeesPage /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/hours" element={
                  <RestaurantProtectedRoute><HoursPage /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/settings" element={
                  <RestaurantProtectedRoute><SettingsPage /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/loyalty" element={
                  <RestaurantProtectedRoute><LoyaltyPage /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/whatsapp" element={
                  <RestaurantProtectedRoute><WhatsAppPage /></RestaurantProtectedRoute>
                } />
                <Route path="/r/:slug/admin/suggestions" element={
                  <RestaurantProtectedRoute><SuggestionsPage /></RestaurantProtectedRoute>
                } />
                
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
                  path="/reseller/restaurants/:restaurantId" 
                  element={
                    <ProtectedRoute requiredRole="reseller">
                      <RestaurantDetailsPage />
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
        </RestaurantAdminProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
