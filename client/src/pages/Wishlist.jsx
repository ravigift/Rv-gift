import { Link } from "react-router-dom";
import { FaHeart, FaShoppingBag } from "react-icons/fa";

const Wishlist = () => {
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
                <FaHeart size={32} className="text-red-300" />
            </div>
            <h1 className="text-xl font-black text-zinc-800 mb-1">Your Wishlist</h1>
            <p className="text-zinc-400 text-sm mb-2 text-center max-w-xs">
                Save your favourite items here! Wishlist feature coming soon.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-6">
                <p className="text-amber-700 text-xs font-bold">🚧 Coming Soon</p>
            </div>
            <Link to="/"
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md shadow-amber-200">
                <FaShoppingBag size={13} /> Browse Products
            </Link>
        </div>
    );
};

export default Wishlist;