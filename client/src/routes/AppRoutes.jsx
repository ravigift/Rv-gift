import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import PageTransition from "../components/PageTransition"; // ✅ smooth transitions

// Eagerly loaded
import Home from "../pages/Home";
import Login from "../pages/Login";

const Products = lazy(() => import("../pages/Products"));
const Register = lazy(() => import("../pages/Register"));
const Cart = lazy(() => import("../pages/Cart"));
const Checkout = lazy(() => import("../pages/Checkout"));
const MyOrders = lazy(() => import("../pages/MyOrders"));
const OrderDetails = lazy(() => import("../pages/OrderDetails"));
const OrderSuccess = lazy(() => import("../pages/OrderSuccess"));
const ProductDetails = lazy(() => import("../components/ProductDetails"));
const Profile = lazy(() => import("../pages/Profile"));
const ForgotPassword = lazy(() => import("../pages/Forgotpassword"));
const ResetPassword = lazy(() => import("../pages/Resetpassword"));
const VerifyInvoice = lazy(() => import("../pages/Verifyinvoice"));
const PrivacyPolicy = lazy(() => import("../pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("../pages/TermsConditions"));
const RefundPolicy = lazy(() => import("../pages/RefundPolicy"));
const ContactUs = lazy(() => import("../pages/Contactus")); // ✅ file renamed: no space

import Loader from "../components/Loader";

const PageLoader = () => (
    <div className="min-h-[70vh] flex items-center justify-center bg-stone-50/50">
        <Loader size="lg" text="Loading RV Gifts" subtext="Crafting memories with love..." />
    </div>
);

const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
};

const AppRoutes = () => (
    <>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
            <PageTransition>
                <Routes>
                    {/* PUBLIC */}
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/verify/:invoiceNumber" element={<VerifyInvoice />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-conditions" element={<TermsConditions />} />
                    <Route path="/refund-policy" element={<RefundPolicy />} />
                    <Route path="/contact" element={<ContactUs />} />

                    {/* PROTECTED */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/orders" element={<MyOrders />} />
                        <Route path="/orders/:id" element={<OrderDetails />} />
                        <Route path="/order-success/:id" element={<OrderSuccess />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/profile/addresses" element={<Profile />} />
                    </Route>

                    {/* FALLBACK */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </PageTransition>
        </Suspense>
    </>
);

export default AppRoutes;