import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { useWishlistSync } from './hooks/useWishlistSync';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { MyOrders } from './pages/user/MyOrders';
import { NotificationsPage } from './pages/user/Notifications';
import { WishlistPage } from './pages/user/Wishlist';
import { CartPage } from './pages/user/Cart';
import { UserSettings } from './pages/user/Settings';
import ForgotPassword from './pages/user/ForgotPassword';
import Profile from './pages/user/Profile';
import OrderDetails from './pages/user/OrderDetails';
import WriteReview from './pages/user/WriteReview';
// import SellerDashboard from './pages/seller/SellerDashboard'; // Unused - using SellerDashboardWrapper instead
import { SellerDashboardWrapper } from './pages/seller/SellerDashboardWrapper';
import { SellerLanding } from './pages/seller/SellerLanding';
import SellerSignup from './pages/seller/SellerSignup';
import SellerLogin from './pages/seller/SellerLogin';
import SellerForgotPassword from './pages/seller/SellerForgotPassword';
import AnalyticsDashboard from './pages/seller/AnalyticsDashboard';
import SellerProfile from './pages/seller/SellerProfile';
import { SellerProductListingWrapper } from './pages/seller/SellerProductListingWrapper';
import { SellerOrderManagementWrapper } from './pages/seller/SellerOrderManagementWrapper';
import { SellerWalletWrapper } from './pages/seller/SellerWalletWrapper';
import { SellerVerificationWrapper } from './pages/seller/SellerVerificationWrapper';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverview } from './pages/admin/modules/AdminOverview';
import { UserManagement } from './pages/admin/modules/UserManagement';
import { SellerManagement } from './pages/admin/modules/SellerManagement';
import { ProductManagement } from './pages/admin/modules/ProductManagement';
import { OrderManagement } from './pages/admin/modules/OrderManagement';
import { CategoryManagement } from './pages/admin/modules/CategoryManagement';
import { BannerManagement } from './pages/admin/modules/BannerManagement';
import { PromotionManagement } from './pages/admin/modules/PromotionManagement';
import { ReviewManagement } from './pages/admin/modules/ReviewManagement';
import { ComplaintManagement } from './pages/admin/modules/ComplaintManagement';
import { AccountsManagement } from './pages/admin/modules/AccountsManagement';
import { ReportsManagement } from './pages/admin/modules/ReportsManagement';
import { AdminManagement } from './pages/admin/modules/AdminManagement';
import { ProfilePage } from './pages/admin/modules/ProfilePage';
import { SettingsPage } from './pages/admin/modules/SettingsPage';
import { SellerKYCSubmissionManagement } from './pages/admin/modules/SellerKYCSubmissionManagement';
import { ProductVariantManagement } from './pages/admin/modules/ProductVariantManagement';
import SearchManagement from './pages/admin/modules/SearchManagement';
import AuditLogs from './pages/admin/modules/AuditLogs';
import SystemHealth from './pages/admin/modules/SystemHealth';
import { NewHome } from './pages/NewHome';
import ProductDetailsPage from './pages/ProductDetailsPage';
import { CategoryProducts } from './pages/CategoryProducts';
import { SectionProducts } from './pages/SectionProducts';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsService from './pages/TermsService';
import ShippingPolicy from './pages/ShippingPolicy';
import RefundPolicy from './pages/RefundPolicy';
import UserAddressManagement from './pages/user/AddressManagement';
import AdminAddressManagement from './pages/admin/components/AdminAddressManagement';
import OTPVerification from './pages/OTPVerification';
import NewPassword from './pages/NewPassword';
import Checkout from './pages/user/Checkout';
import ShippingAddressPage from './pages/user/ShippingAddress';
import OrderSummaryPage from './pages/user/OrderSummary';
import OrderConfirmationPage from './pages/user/OrderConfirmation';
import { ProductListingLayout } from './pages/admin/modules/ProductListingLayout';
import { AdminListings1 } from './pages/admin/modules/AdminListings1';
import { AdminListings2 } from './pages/admin/modules/AdminListings2';
import { AdminListings3 } from './pages/admin/modules/AdminListings3';
import { AdminListing4 } from './pages/admin/modules/AdminListing4';
import { AdminListing5 } from './pages/admin/modules/AdminListing5';
import { AdminListing6 } from './pages/admin/modules/AdminListing6';

// Simple path-based route guard
const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authRole, loading } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    if (loading) return;

    // Public routes — always accessible
    const publicPaths = [
      '/', '/login', '/signup', '/otp-verification', '/forgot-password', '/new-password',
      '/seller', '/seller/login', '/seller/signup', '/seller/otp-verification',
      '/seller/forgot-password', '/seller/new-password',
      '/admin/login', '/admin/signup',
      '/privacy-policy', '/terms-of-service', '/shipping-policy', '/refund-policy',
      '/products', '/category',
    ];

    const isPublic = publicPaths.some(p => path === p) ||
      path.startsWith('/products/') || path.startsWith('/category/');

    if (isPublic) return;

    // Block unauthenticated users from all protected routes
    if (!authRole) {
      if (path.startsWith('/admin') || path.startsWith('/seller/')) {
        window.location.href = '/seller/login';
      } else {
        window.location.href = '/login';
      }
      return;
    }

    // ADMIN ROUTES: Allow admin ONLY
    if (path.startsWith('/admin')) {
      if (authRole !== 'admin') {
        window.location.href = '/seller';
      }
    }

    // SELLER ROUTES: Allow seller OR admin
    if (path.startsWith('/seller/dashboard') || path.startsWith('/seller/products') || 
        path.startsWith('/seller/orders') || path.startsWith('/seller/wallet') ||
        path.startsWith('/seller/analytics') || path.startsWith('/seller/profile') ||
        path.startsWith('/seller/verify')) {
      if (authRole !== 'seller' && authRole !== 'admin') {
        window.location.href = '/seller/login';
      }
    }

    // USER ROUTES: Allow user ONLY (protected user pages)
    if (path.startsWith('/orders') || path.startsWith('/profile') || 
        path.startsWith('/wishlist') || path.startsWith('/cart') ||
        path.startsWith('/checkout') || path.startsWith('/settings') ||
        path.startsWith('/notifications') || path.startsWith('/user/')) {
      if (authRole !== 'user') {
        window.location.href = '/login';
      }
    }
  }, [authRole, path, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-amber-600 text-xl font-medium">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
};

// Auto-sync wishlist when user logs in
const WishlistAutoSync: React.FC = () => {
  useWishlistSync();
  return null;
};

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <WishlistAutoSync />
              <RouteGuard>
                <Routes>
                  <Route path="/" element={<NewHome />} />
                  <Route path="/products/section/:section" element={<SectionProducts />} />
                  <Route path="/products/:productId" element={<ProductDetailsPage />} />
                  <Route path="/category/:categoryId" element={<CategoryProducts />} />
                  
                  {/* Legal Pages */}
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsService />} />
                  <Route path="/shipping-policy" element={<ShippingPolicy />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  
                  {/* User Routes */}
                  <Route path="/login" element={<Login role="user" />} />
                  <Route path="/signup" element={<Signup role="user" />} />
                  <Route path="/otp-verification" element={<OTPVerification />} />
                  <Route path="/new-password" element={<NewPassword />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/orders" element={<MyOrders />} />
                  <Route path="/orders/:orderId" element={<OrderDetails />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/settings" element={<UserSettings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/products/:productId/review" element={<WriteReview />} />
                  <Route path="/user/addresses" element={<UserAddressManagement />} />
                  
                  {/* Checkout Flow Routes */}
                  <Route path="/checkout/shipping" element={<ShippingAddressPage />} />
                  <Route path="/checkout/review" element={<OrderSummaryPage />} />
                  <Route path="/checkout/payment" element={<Checkout />} />
                  <Route path="/checkout/confirmation" element={<OrderConfirmationPage />} />
                  
                  {/* Seller Routes */}
                  <Route path="/seller" element={<SellerLanding />} />
                  <Route path="/seller/login" element={<SellerLogin />} />
                  <Route path="/seller/signup" element={<SellerSignup />} />
                  <Route path="/seller/otp-verification" element={<OTPVerification />} />
                  <Route path="/seller/new-password" element={<NewPassword />} />
                  <Route path="/seller/forgot-password" element={<SellerForgotPassword />} />
                  <Route path="/seller/analytics" element={<AnalyticsDashboard />} />
                  <Route path="/seller/profile" element={<SellerProfile />} />
                  <Route path="/seller/dashboard" element={<SellerDashboardWrapper />} />
                  <Route path="/seller/products" element={<SellerProductListingWrapper />} />
                  <Route path="/seller/orders" element={<SellerOrderManagementWrapper />} />
                  <Route path="/seller/wallet" element={<SellerWalletWrapper />} />
                  <Route path="/seller/verify" element={<SellerVerificationWrapper />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<Navigate to="/seller/login" replace />} />
                  <Route path="/admin/signup" element={<Navigate to="/seller/login" replace />} />
                  <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
                  
                  {/* Admin Layout Routes */}
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminOverview />} />
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/sellers" element={<SellerManagement />} />
                    <Route path="/admin/products" element={<ProductManagement />} />
                    <Route path="/admin/variants" element={<ProductVariantManagement />} />
                    <Route path="/admin/orders" element={<OrderManagement />} />
                    <Route path="/admin/categories" element={<CategoryManagement />} />
                    <Route path="/admin/banners" element={<BannerManagement />} />
                    <Route path="/admin/promotions" element={<PromotionManagement />} />
                    <Route path="/admin/reviews" element={<ReviewManagement />} />
                    <Route path="/admin/complaints" element={<ComplaintManagement />} />
                    <Route path="/admin/accounts" element={<AccountsManagement />} />
                    <Route path="/admin/reports" element={<ReportsManagement />} />
                    <Route path="/admin/admins" element={<AdminManagement />} />
                    <Route path="/admin/profile" element={<ProfilePage />} />
                    <Route path="/admin/settings" element={<SettingsPage />} />
                    <Route path="/admin/search" element={<SearchManagement />} />
                    <Route path="/admin/audit-logs" element={<AuditLogs />} />
                    <Route path="/admin/health" element={<SystemHealth />} />
                    <Route path="/admin/addresses" element={<AdminAddressManagement />} />
                    <Route path="/admin/seller-kyc" element={<SellerKYCSubmissionManagement />} />
                    
                    {/* Product Listing Wizard Routes */}
                    <Route path="/admin/products/new" element={<ProductListingLayout />}>
                      <Route index element={<AdminListings1 />} />
                      <Route path="step1" element={<AdminListings1 />} />
                      <Route path="step2" element={<AdminListings2 />} />
                      <Route path="step3" element={<AdminListings3 />} />
                      <Route path="step4" element={<AdminListing4 />} />
                      <Route path="step5" element={<AdminListing5 />} />
                      <Route path="step6" element={<AdminListing6 />} />
                    </Route>
                  </Route>
                  
                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </RouteGuard>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
