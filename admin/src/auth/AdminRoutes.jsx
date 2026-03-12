import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "./AdminAuthContext";

const AdminRoute = () => {
    const { admin, loading } = useAdminAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="text-center">
                    <div className="h-10 w-10 animate-spin border-4 border-amber-400 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-zinc-400 text-sm font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!admin) {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;