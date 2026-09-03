import React from "react";
import Logo from "../assets/logo.png.jpeg";

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * PROFESSIONAL BRANDED LOADER COMPONENT (RV Gifts & Printing)
 * ══════════════════════════════════════════════════════════════════════════════
 * Usage:
 *  - <Loader fullScreen text="Loading RV Gifts..." />
 *  - <Loader size="lg" text="Fetching orders..." />
 *  - <Loader size="sm" inline />
 *  - <ProductCardSkeleton count={6} />
 */

export const Loader = ({
    fullScreen = false,
    size = "md",
    text = "Loading...",
    subtext = "",
    className = "",
    inline = false,
}) => {
    // Size variants
    const sizeMap = {
        xs: { spinner: "w-4 h-4 border-2", logo: "w-2.5 h-2.5", font: "text-xs" },
        sm: { spinner: "w-8 h-8 border-2", logo: "w-4 h-4", font: "text-xs" },
        md: { spinner: "w-14 h-14 border-3", logo: "w-8 h-8", font: "text-sm" },
        lg: { spinner: "w-20 h-20 border-4", logo: "w-11 h-11", font: "text-base" },
        xl: { spinner: "w-28 h-28 border-4", logo: "w-16 h-16", font: "text-lg" },
    };

    const s = sizeMap[size] || sizeMap.md;

    // Inline button spinner
    if (inline) {
        return (
            <span className={`inline-flex items-center gap-2 ${className}`}>
                <span className={`${s.spinner} border-amber-400/30 border-t-amber-500 rounded-full animate-spin shrink-0`} />
                {text && <span className="font-semibold">{text}</span>}
            </span>
        );
    }

    const content = (
        <div className={`flex flex-col items-center justify-center p-6 text-center select-none ${className}`}>
            <style>{`
                @keyframes pulseGlow {
                    0%, 100% { transform: scale(1); opacity: 0.85; }
                    50% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 16px rgba(245, 158, 11, 0.5)); }
                }
                @keyframes orbitSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .loader-glow-ring {
                    animation: orbitSpin 1.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
                }
                .loader-pulse-logo {
                    animation: pulseGlow 2s ease-in-out infinite;
                }
            `}</style>

            {/* Spinner Container */}
            <div className="relative flex items-center justify-center mb-4">
                {/* Outer Glow Halo */}
                <div className="absolute w-24 h-24 bg-gradient-to-tr from-amber-400/20 via-orange-400/10 to-transparent rounded-full blur-xl pointer-events-none" />

                {/* Rotating Outer Gradient Orbit */}
                <div
                    className={`${s.spinner} loader-glow-ring rounded-full border-amber-200/40 border-t-amber-500 border-r-amber-400 shadow-sm`}
                    style={{ borderTopColor: "#f59e0b", borderRightColor: "#fbbf24" }}
                />

                {/* Center Pulsing Brand Icon */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <img
                        src={Logo}
                        alt="RV Gifts"
                        className={`${s.logo} object-contain rounded-full loader-pulse-logo shadow-xs`}
                    />
                </div>
            </div>

            {/* Main Loading Label */}
            {text && (
                <div className="flex items-center gap-1.5 font-black tracking-tight text-zinc-800 font-sans">
                    <span className={s.font}>{text}</span>
                    <span className="flex gap-1 ml-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                </div>
            )}

            {/* Subtext description */}
            {subtext && (
                <p className="text-xs text-zinc-400 font-medium mt-1 max-w-xs leading-relaxed">
                    {subtext}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/85 backdrop-blur-md transition-all duration-300">
                <div className="bg-white/90 p-8 rounded-3xl border border-amber-100/80 shadow-2xl shadow-amber-900/10 max-w-sm w-full mx-4">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

/**
 * Product Card Skeleton for Grid Loading
 */
export const ProductCardSkeleton = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 w-full">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white rounded-2xl border border-stone-100 p-3 sm:p-3.5 flex flex-col justify-between shadow-xs overflow-hidden animate-pulse"
                >
                    <div className="w-full aspect-square bg-stone-100 rounded-xl mb-3" />
                    <div className="space-y-2">
                        <div className="h-3.5 bg-stone-100 rounded-md w-3/4" />
                        <div className="h-2.5 bg-stone-100 rounded-md w-1/2" />
                        <div className="flex items-center justify-between pt-2">
                            <div className="h-4 bg-amber-100 rounded-md w-1/3" />
                            <div className="h-7 w-7 bg-stone-100 rounded-lg" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Loader;
