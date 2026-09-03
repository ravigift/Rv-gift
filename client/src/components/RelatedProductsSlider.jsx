import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";

const RelatedProductsSlider = ({ products }) => {
    const sliderRef = useRef(null);

    const scroll = (direction) => {
        if (!sliderRef.current) return;

        const scrollAmount = 300;
        sliderRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    if (!products || products.length === 0) return null;

    return (
        <div className="relative">
            {/* LEFT BUTTON */}
            <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10
                           bg-white shadow-md rounded-full p-2 hover:bg-slate-100"
            >
                <ChevronLeft />
            </button>

            {/* SLIDER */}
            <div
                ref={sliderRef}
                className="flex gap-4 overflow-x-auto scroll-smooth
                           scrollbar-hide px-10"
            >
                {products.map((product, i) => (
                    <div
                        key={product._id}
                        className="w-[200px] sm:w-[220px] shrink-0"
                    >
                        <ProductCard product={product} index={i} />
                    </div>
                ))}
            </div>

            {/* RIGHT BUTTON */}
            <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10
                           bg-white shadow-md rounded-full p-2 hover:bg-slate-100"
            >
                <ChevronRight />
            </button>
        </div>
    );
};

export default RelatedProductsSlider;