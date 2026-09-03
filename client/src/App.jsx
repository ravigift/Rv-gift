import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isAuthPage = [
    "/login",
    "/register",
    "/forgot-password",
  ].includes(location.pathname) || location.pathname.startsWith("/reset-password");

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthPage && <Navbar />}
      <main className="flex-1">
        <AppRoutes />
      </main>
      {isHomePage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}