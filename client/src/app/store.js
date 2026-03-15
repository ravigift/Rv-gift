import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
    persistReducer, persistStore,
    FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import cartReducer from "../features/cart/cartSlice";
import orderReducer from "../features/orders/orderSlice";
import productReducer from "../features/products/productSlice";

// ── User-specific persist key ─────────────────────────────────
// Har user ka cart alag localStorage key mein save hoga.
// "cart_guest"  → koi login nahi
// "cart_abc123" → user ID se
// Isse ek user ka cart doosre ko nahi dikhega.
const getUserId = () => {
    try {
        const auth = localStorage.getItem("auth");
        if (auth) {
            const parsed = JSON.parse(auth);
            if (parsed?.user?._id) return parsed.user._id;
        }
    } catch { /* ignore */ }
    return "guest";
};

const persistConfig = {
    key: `cart_${getUserId()}`, // ✅ user-specific key
    storage,
    whitelist: ["cart"],
};

const rootReducer = combineReducers({
    cart: cartReducer,
    orders: orderReducer,
    products: productReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
    devTools: import.meta.env.DEV,
});

export const persistor = persistStore(store);