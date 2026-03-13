import { Link } from "react-router-dom";
import {
    FaFacebookF, FaInstagram, FaTwitter,
    FaMapMarkerAlt, FaPhoneAlt, FaEnvelope,
    FaGift, FaHeart
} from "react-icons/fa";

const Footer = () => {
    return (
        <footer className="bg-[#0f1923] text-slate-400 mt-auto">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
                .footer-font { font-family: 'DM Sans', sans-serif; }
                .footer-link { transition: all 0.2s; }
                .footer-link:hover { color: #f59e0b; padding-left: 4px; }
            `}</style>

            <div className="footer-font max-w-7xl mx-auto px-4 sm:px-6">

                {/* TOP GRADIENT BAR */}
                <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 rounded-b-full mb-0" />

                <div className="py-14">
                    {/* GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

                        {/* BRAND */}
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/30">
                                    <FaGift size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white leading-tight">
                                        RV Gift Shop
                                    </h3>
                                    <p className="text-xs text-slate-500">& Printing</p>
                                </div>
                            </div>

                            <p className="text-sm leading-relaxed mb-6 text-slate-400">
                                Premium gifts, fast delivery and trusted service.
                                Order online and get gifts delivered with care.
                            </p>

                            {/* SOCIAL */}
                            <div className="flex gap-3">
                                {[
                                    { href: "#", icon: <FaFacebookF size={13} />, label: "Facebook" },
                                    { href: "https://www.instagram.com/rv_gift_shop_and_printing/", icon: <FaInstagram size={13} />, label: "Instagram" },
                                    { href: "#", icon: <FaTwitter size={13} />, label: "Twitter" },
                                ].map(({ href, icon, label }) => (
                                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                                        aria-label={label}
                                        className="w-9 h-9 bg-white/5 border border-white/10 hover:bg-amber-500 hover:border-amber-500 hover:text-white rounded-full flex items-center justify-center transition-all duration-300 text-slate-400">
                                        {icon}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* QUICK LINKS */}
                        <div>
                            <h4 className="text-white font-black mb-5 text-sm uppercase tracking-widest">
                                Quick Links
                            </h4>
                            <ul className="space-y-3 text-sm">
                                {[
                                    { to: "/", label: "Home" },
                                    { to: "/products", label: "Products" },
                                    { to: "/cart", label: "Cart" },
                                    { to: "/orders", label: "My Orders" },
                                ].map(({ to, label }) => (
                                    <li key={to}>
                                        <Link to={to} className="footer-link hover:text-amber-400 flex items-center gap-1.5">
                                            <span className="w-1 h-1 bg-amber-500 rounded-full" />
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* LEGAL */}
                        <div>
                            <h4 className="text-white font-black mb-5 text-sm uppercase tracking-widest">
                                Legal
                            </h4>
                            <ul className="space-y-3 text-sm">
                                {[
                                    { to: "/privacy-policy", label: "Privacy Policy" },
                                    { to: "/terms-conditions", label: "Terms & Conditions" },
                                    { to: "/refund-policy", label: "Refund Policy" },
                                    { to: "/contact", label: "Contact Us" },
                                ].map(({ to, label }) => (
                                    <li key={to}>
                                        <Link to={to} className="footer-link hover:text-amber-400 flex items-center gap-1.5">
                                            <span className="w-1 h-1 bg-amber-500 rounded-full" />
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* CONTACT */}
                        <div>
                            <h4 className="text-white font-black mb-5 text-sm uppercase tracking-widest">
                                Contact
                            </h4>
                            <ul className="space-y-4 text-sm">
                                <li>
                                    <a href="https://maps.app.goo.gl/bpjDdpu4dJL3DcvT9"
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex items-start gap-3 hover:text-amber-400 transition-colors group">
                                        <div className="w-7 h-7 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:border-amber-500 transition-all">
                                            <FaMapMarkerAlt size={11} className="text-amber-500 group-hover:text-white" />
                                        </div>
                                        <span className="mt-0.5 leading-relaxed">
                                            Gadri chowk Dostpur chauraha,<br />
                                            Akbarpur, Ambedkar Nagar<br />
                                            UP – 224122
                                        </span>
                                    </a>
                                </li>
                                <li>
                                    <a href="tel:+918299519532"
                                        className="flex items-center gap-3 hover:text-amber-400 transition-colors group">
                                        <div className="w-7 h-7 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:border-amber-500 transition-all">
                                            <FaPhoneAlt size={11} className="text-amber-500 group-hover:text-white" />
                                        </div>
                                        +91 82995 19532
                                    </a>
                                </li>
                                <li>
                                    <a href="mailto:officialrvgift@gmail.com"
                                        className="flex items-center gap-3 hover:text-amber-400 transition-colors group">
                                        <div className="w-7 h-7 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:border-amber-500 transition-all">
                                            <FaEnvelope size={11} className="text-amber-500 group-hover:text-white" />
                                        </div>
                                        officialrvgift@gmail.com
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* BOTTOM BAR */}
                    <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                        <p>© {new Date().getFullYear()} RV Gift and Printing. All rights reserved.</p>
                        <p className="flex items-center gap-1.5">
                            Made with <FaHeart size={10} className="text-red-500 animate-pulse" /> in India 🇮🇳 •
                            <a href="https://your-portfolio-link" target="_blank" rel="noopener noreferrer"
                                className="text-amber-500 hover:text-amber-400 transition-colors ml-1">
                                Dhananjay Pandey
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;