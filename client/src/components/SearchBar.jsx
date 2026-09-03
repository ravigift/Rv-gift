import { useEffect, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { FaSearch, FaTimes } from "react-icons/fa";

const SearchBar = ({ onSearch }) => {
    const [input, setInput] = useState("");
    const [error, setError] = useState("");
    const [searchParams] = useSearchParams();
    const location = useLocation();

    // URL → INPUT sync
    useEffect(() => {
        const q = searchParams.get("search") || "";
        setInput(q);
        setError("");
    }, [location.search]);

    const triggerSearch = () => {
        if (input.trim().length < 2) {
            setError("Enter at least 2 characters");
            return;
        }
        setError("");
        onSearch(input.trim());
    };

    const clearSearch = () => {
        setInput("");
        setError("");
        onSearch("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            triggerSearch();
        }
    };

    return (
        <div className="w-full relative">
            <div className="flex items-center w-full rounded-full border border-stone-200 bg-stone-50/70 hover:bg-stone-50/90 focus-within:bg-white focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-400/15 shadow-xs transition-all duration-200 p-1 pl-4">
                {/* Search icon */}
                <div className="flex items-center text-zinc-400 shrink-0 mr-2">
                    <FaSearch size={13} className="text-zinc-400 group-focus-within:text-amber-500" />
                </div>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => { setInput(e.target.value); setError(""); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search gifts, lamps, mugs, custom frames..."
                    className="flex-1 text-[13px] text-zinc-800 placeholder-zinc-400 bg-transparent focus:outline-none min-w-0 font-medium"
                />

                {/* Clear button */}
                {input && (
                    <button
                        onClick={clearSearch}
                        className="px-2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                        aria-label="Clear search"
                        type="button"
                    >
                        <FaTimes size={11} />
                    </button>
                )}

                {/* Search button */}
                <button
                    onClick={triggerSearch}
                    type="button"
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shadow-sm shadow-amber-500/20 cursor-pointer shrink-0"
                >
                    Search
                </button>
            </div>

            {error && (
                <p className="absolute top-full left-4 text-red-500 text-[11px] font-semibold mt-1 animate-pulse">
                    {error}
                </p>
            )}
        </div>
    );
};

export default SearchBar;