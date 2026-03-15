import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import { store } from "../app/store";       // ✅ Redux store
import { clearCart } from "../features/cart/cartSlice"; // ✅ clearCart action

const AuthContext = createContext(null);

/* ── Location helper ── */
const requestLocation = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                    );
                    const data = await res.json();
                    const city =
                        data.address?.city ||
                        data.address?.town ||
                        data.address?.village ||
                        data.address?.county ||
                        "Unknown";
                    const state = data.address?.state || "";
                    resolve({ latitude, longitude, city, state });
                } catch { resolve(null); }
            },
            () => resolve(null),
            { timeout: 5000 }
        );
    });
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [locationAsked, setLocationAsked] = useState(false);

    /* ── Init from localStorage ── */
    useEffect(() => {
        try {
            const stored = localStorage.getItem("auth");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.user && parsed?.token) {
                    setUser(parsed.user);
                } else {
                    localStorage.removeItem("auth");
                }
            }
        } catch {
            localStorage.removeItem("auth");
        } finally {
            setLoading(false);
        }
    }, []);

    /* ── Save location after login ── */
    const saveUserLocation = async (userId) => {
        if (locationAsked) return;
        setLocationAsked(true);
        const location = await requestLocation();
        if (location) {
            try {
                await api.post("/auth/save-location", { userId, ...location });
            } catch { /* silent fail */ }
        }
    };

    /* ── Internal: save to localStorage + state ── */
    const _saveAuth = (data) => {
        const authData = {
            token: data.token,
            user: {
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role,
            },
        };
        localStorage.setItem("auth", JSON.stringify(authData));
        setUser(authData.user);
    };

    /* ── Login ── */
    const login = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        _saveAuth(data);
        saveUserLocation(data._id);
    };

    /* ── Login with data (after OTP verify) ── */
    const loginWithData = (data) => {
        _saveAuth(data);
        saveUserLocation(data._id);
    };

    /* ── Register ── */
    const register = async (name, email, password) => {
        await api.post("/auth/register", { name, email, password });
    };

    /* ── Logout — cart bhi clear karo ── */
    const logout = () => {
        // ✅ Redux cart clear karo — doosre user ko nahi dikhega
        store.dispatch(clearCart());

        // ✅ localStorage se auth + cart data hatao
        const userId = user?._id || "guest";
        localStorage.removeItem("auth");
        localStorage.removeItem(`persist:cart_${userId}`); // user-specific cart key
        localStorage.removeItem("cartItems");               // CartContext ka bhi (agar use ho)

        setUser(null);
        setLocationAsked(false);
    };

    return (
        <AuthContext.Provider value={{ user, login, loginWithData, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);