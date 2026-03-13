/**
 * utils/imageUrl.js
 * Cloudinary URL optimizer — use everywhere instead of raw URLs.
 *
 * Width presets:
 *   thumbnail  → 200  (cart, order success small items)
 *   card       → 400  (product cards in grid)
 *   detail     → 800  (product detail hero)
 *   zoom       → 1200 (lightbox / zoomed view)
 */

/**
 * Returns an optimized Cloudinary URL.
 * q_auto = auto quality (Cloudinary picks best quality/size balance)
 * f_auto = auto format  (WebP for Chrome, AVIF for newer, JPG fallback)
 * w_{n}  = resize to max width (height auto-scales)
 *
 * @param {string} url    - Raw Cloudinary URL from DB
 * @param {number} width  - Max display width in px
 * @returns {string}
 */
export const optimizeImage = (url, width = 400) => {
    if (!url || !url.includes("cloudinary.com")) return url ?? "";
    // Avoid double-transforming if already optimized
    if (url.includes("/upload/q_auto")) return url;
    return url.replace("/upload/", `/upload/q_auto,f_auto,w_${width}/`);
};

/** Presets for consistent usage across components */
export const imgUrl = {
    thumbnail: (url) => optimizeImage(url, 200),
    card: (url) => optimizeImage(url, 400),
    detail: (url) => optimizeImage(url, 800),
    zoom: (url) => optimizeImage(url, 1200),
};