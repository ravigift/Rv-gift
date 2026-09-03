import { Routes, Route, Navigate } from "react-router-dom";

/* AUTH */
import AdminLogin from "../pages/AdminLogin";
import AdminForgotPassword from "../pages/AdminForgotPassword";
import AdminResetPassword from "../pages/AdminResetPassword";

/* ADMIN LAYOUT */
import Admin from "../pages/Admin";

/* ADMIN PAGES */
import AdminDashboard from "../pages/AdminDashboard";
import AdminReports from "../pages/AdminReports";
import AdminBanners from "../pages/AdminBanners";
import AdminHomeContent from "../pages/AdminHomeContent";
import AdminProducts from "../pages/AdminProducts";
import AdminAddProduct from "../pages/AdminAddProduct";
import AdminEditProduct from "../pages/AdminEditProduct";
import AdminOrders from "../pages/AdminOrders";
import AdminPOS from "../pages/AdminPOS";
import AdminRefundReturn from "../pages/AdminRefundReturn";
import AdminCustomers from "../pages/AdminCustomers";
import AdminContactQueries from "../pages/AdminContactQueries";

/* PROTECTED */
import AdminRoute from "./AdminRoute";

const AppRoutes = () => {
    return (
        <Routes>
            {/* AUTH — PUBLIC */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
            <Route path="/admin/reset-password/:token" element={<AdminResetPassword />} />

            {/* PROTECTED ADMIN PANEL */}
            <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Admin />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="banners" element={<AdminBanners />} />
                    <Route path="home-content" element={<AdminHomeContent />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminAddProduct />} />
                    <Route path="products/:id/edit" element={<AdminEditProduct />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="refunds" element={<AdminRefundReturn />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="queries" element={<AdminContactQueries />} />
                    <Route path="pos" element={<AdminPOS />} />
                </Route>
            </Route>

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
    );
};

export default AppRoutes;