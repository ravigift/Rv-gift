import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    items: [],
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const item = action.payload;

            // ✅ Customization ke saath match karo
            // Same product + same customization = quantity badhao
            // Same product + alag customization = naya item add karo
            const hasCustomization = item.customization?.text ||
                item.customization?.imageUrl ||
                item.customization?.note;

            if (hasCustomization) {
                // Customizable item — hamesha naya add karo (alag customization ho sakti hai)
                state.items.push({ ...item, quantity: 1 });
            } else {
                // Normal item — same _id hai toh quantity badhao
                const exist = state.items.find(
                    p => p._id === item._id && !p.customization?.text && !p.customization?.imageUrl
                );
                if (exist) {
                    exist.quantity += 1;
                } else {
                    state.items.push({ ...item, quantity: 1 });
                }
            }
        },

        buyNowSingle: (state, action) => {
            // ✅ Customization ke saath overwrite
            state.items = [{ ...action.payload, quantity: 1 }];
        },

        updateQuantity: (state, action) => {
            const { id, quantity } = action.payload;
            const item = state.items.find(i => i._id === id);
            if (item && quantity >= 1) {
                item.quantity = quantity;
            }
        },

        removeFromCart: (state, action) => {
            // ✅ Index se remove karo (same product alag customization ke liye)
            if (typeof action.payload === "number") {
                state.items.splice(action.payload, 1);
            } else {
                state.items = state.items.filter(i => i._id !== action.payload);
            }
        },

        clearCart: (state) => {
            state.items = [];
        },
    },
});

export const {
    addToCart,
    buyNowSingle,
    updateQuantity,
    removeFromCart,
    clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;