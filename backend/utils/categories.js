/**
 * categories.js — the ONLY list of valid product categories.
 * Keep this in sync with client/src/data/categories.js and
 * admin/src/data/categories.js (same `value` slugs).
 *
 * A product can only be created/updated with a category whose slug
 * is in this list — anything else is rejected.
 */
export const CATEGORY_SLUGS = [
    // Gifts
    "wedding-nikah",
    "anniversary-birthday",
    "kids-gifts",
    "corporate-gift",
    // Lamps & Lights
    "led-lamp",
    "photo-lamp",
    // Toys
    "soft-toy",
    // Accessories
    "custom-jewelry",
    "wallet-passport",
    "keychain",
    "rakhi-special",
    "hand-watch",
    "perfume",
    // Wearables
    "custom-tshirt",
    "printed-cap",
    // Printing & Decor
    "photo-frame",
    "led-photo-frame",
    "rock-photo-frame",
    "mug-bottle",
    "printed-cushion",
    "office-stationery",
    "home-decor",
];

const CATEGORY_SET = new Set(CATEGORY_SLUGS);

export const isValidCategory = (slug) => CATEGORY_SET.has(String(slug || "").trim());
