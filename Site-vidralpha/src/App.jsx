import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import LayoutPublic from './layouts/LayoutPublic'
import LayoutAdmin from './layouts/LayoutAdmin'
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminOrders = lazy(() => import('./pages/AdminOrders'))
const AdminProducts = lazy(() => import('./pages/AdminProducts'))
const AdminItemCosts = lazy(() => import('./pages/AdminItemCosts'))
const AdminBanners = lazy(() => import('./pages/AdminBanners'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const AdminCoupons = lazy(() => import('./pages/AdminCoupons'))
const AdminDetailedOrders = lazy(() => import('./pages/AdminDetailedOrders'))
const Profile = lazy(() => import('./pages/Profile'))
const CartPage = lazy(() => import('./pages/CartPage'))
import PrivateRoute from './components/PrivateRoute'
import { AuthProvider } from './hooks/useAuth'
import { CartProvider } from './context/CartContext'
import ScrollToTop from './utils/ScrollToTop'
import { Loader2 } from 'lucide-react'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import QuemSomos from './pages/QuemSomos'
import FAQ from './pages/FAQ'
import Contato from './pages/Contato'

import { useAuth } from './hooks/useAuth'
import { Toaster } from 'react-hot-toast'

function AppRoutes() {
  const { profile, user } = useAuth()
  const { pathname } = useLocation()
  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin' || user?.email === 'matheusmatos2898@gmail.com'

  useEffect(() => {
    // 🏂 Inicialização do Lenis (Smooth Scroll de Inércia)
    let lenis;
    if (window.Lenis) {
      lenis = new window.Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    const fadeScroll = () => {
      const elementos = document.querySelectorAll(".scroll-left, .scroll-right, .scroll-top, .scroll-bottom, .blur, .lista .elementor-icon-list-item");
      const posicaoScroll = window.innerHeight * 0.5;

      elementos.forEach(elemento => {
        const elementoTop = elemento.getBoundingClientRect().top - posicaoScroll;
        if (elementoTop < 320) {
          elemento.classList.add("ativo");
        } else {
          elemento.classList.remove("ativo");
        }
      });
    };

    window.addEventListener("scroll", fadeScroll);
    setTimeout(fadeScroll, 100);

    return () => {
      window.removeEventListener("scroll", fadeScroll);
      if (lenis) lenis.destroy();
    };
  }, [pathname]);

  return (
    <Routes>
      <Route path="/" element={<LayoutPublic />}>
        <Route index element={<Home />} />
        <Route path="produtos" element={<Catalog />} />
        <Route path="produtos/:id" element={<ProductDetail />} />
        <Route path="quem-somos" element={<QuemSomos />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="contato" element={<Contato />} />
        <Route path="carrinho" element={<CartPage />} />

        {/* Client Routes - Inside Public Layout */}
        <Route element={<PrivateRoute />}>
          <Route path="/app">
            <Route index element={<Profile />} />
            <Route path="perfil" element={<Profile />} />
            <Route path="config" element={<Profile />} />
            <Route path="pedidos" element={<Dashboard />} />
          </Route>
        </Route>
      </Route>

      {/* Admin Routes - Inside SaaS Layout */}
      <Route element={<PrivateRoute />}>
        {isAdmin && (
          <Route path="/admin" element={<LayoutAdmin />}>
            <Route index element={<AdminDashboard />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="produtos" element={<AdminProducts />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="custo-itens" element={<AdminItemCosts />} />
            <Route path="usuarios" element={<AdminUsers />} />
            <Route path="cupons" element={<AdminCoupons />} />
            <Route path="pedidos-detalhados" element={<AdminDetailedOrders />} />
          </Route>
        )}
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <Suspense fallback={
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 className="animate-spin" size={48} color="var(--color-navy-700)" />
            </div>
          }>
            <AppRoutes />
          </Suspense>
          <Toaster
            position="top-center"
            containerStyle={{ zIndex: 999999 }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#1E293B',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 700,
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                border: '1px solid #E2E8F0',
                padding: '12px 24px',
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
