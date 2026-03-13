import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import MyOrders from "../pages/MyOrders";
import OrderDetails from "../pages/OrderDetails";
import OrderSuccess from "../pages/OrderSuccess";
import ProductDetails from "../components/ProductDetails";
import Profile from "../pages/Profile";
import Wishlist from "../pages/Wishlist";
import ForgotPassword from "../pages/Forgotpassword";
import ResetPassword from "../pages/Resetpassword";
import VerifyInvoice from "../pages/Verifyinvoice";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import TermsConditions from "../pages/TermsConditions";
import RefundPolicy from "../pages/RefundPolicy";
import ContactUs from "../pages/Contactus ";


const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
};

const AppRoutes = () => {
    return (
        <>
            <ScrollToTop />
            <Routes>
                {/* PUBLIC */}
                <Route path="/" element={<Home />} />
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
                    <Route path="/wishlist" element={<Wishlist />} />
                </Route>

                {/* FALLBACK */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
};

export default AppRoutes;