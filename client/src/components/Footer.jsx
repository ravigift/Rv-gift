import { Link } from "react-router-dom";
import {
    FaFacebookF, FaInstagram, FaWhatsapp,
    FaMapMarkerAlt, FaPhoneAlt, FaEnvelope,
    FaGift, FaPrint
} from "react-icons/fa";

const Footer = () => {
    return (
        <footer style={{ background: "#0a0d12", color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }} className="mt-auto">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');

                .ftr-root { font-family: 'DM Sans', sans-serif; }

                .ftr-link {
                    color: #64748b; text-decoration: none; font-size: 13.5px;
                    font-weight: 400; letter-spacing: 0.01em; transition: color 0.2s ease;
                    display: flex; align-items: center; gap: 8px;
                }
                .ftr-link:hover { color: #c9973a; }

                .ftr-social {
                    width: 38px; height: 38px;
                    border: 1px solid rgba(255,255,255,0.08); border-radius: 9px;
                    display: flex; align-items: center; justify-content: center;
                    color: #64748b; text-decoration: none;
                    transition: all 0.25s ease; background: rgba(255,255,255,0.03);
                }
                .ftr-social:hover {
                    background: #c9973a; border-color: #c9973a;
                    color: #fff; transform: translateY(-2px);
                    box-shadow: 0 6px 18px rgba(201,151,58,0.3);
                }

                .ftr-contact-icon {
                    width: 34px; height: 34px; min-width: 34px;
                    border: 1px solid rgba(201,151,58,0.2); border-radius: 9px;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(201,151,58,0.06); flex-shrink: 0; transition: all 0.2s;
                }
                .ftr-contact-row:hover .ftr-contact-icon {
                    background: rgba(201,151,58,0.15); border-color: rgba(201,151,58,0.4);
                }
                .ftr-contact-row {
                    display: flex; align-items: flex-start; gap: 13px;
                    color: #64748b; text-decoration: none; font-size: 13px;
                    line-height: 1.65; transition: color 0.2s;
                }
                .ftr-contact-row:hover { color: #c9973a; }

                .ftr-divider {
                    width: 32px; height: 2px;
                    background: linear-gradient(90deg, #c9973a, transparent);
                    margin: 10px 0 20px; border-radius: 2px;
                }

                .ftr-heading {
                    font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
                    text-transform: uppercase; color: #cbd5e1; margin-bottom: 6px;
                }

                .ftr-top-strip {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(201,151,58,0.6), transparent);
                }

                .ftr-bottom {
                    border-top: 1px solid rgba(255,255,255,0.05);
                    padding: 22px 0;
                    display: flex; flex-wrap: wrap; align-items: center;
                    justify-content: space-between; gap: 12px;
                }

                .ftr-tagline {
                    font-family: 'Playfair Display', serif; font-size: 13px;
                    font-style: italic; color: #475569; letter-spacing: 0.02em;
                }

                .ftr-dot {
                    width: 4px; height: 4px; background: #c9973a; border-radius: 50%;
                    display: inline-block; margin: 0 2px; opacity: 0.7; flex-shrink: 0;
                }

                .ftr-brand-name {
                    font-family: 'Playfair Display', serif; font-weight: 700;
                    font-size: 20px; color: #f1f5f9; letter-spacing: -0.01em; line-height: 1.1;
                }

                .ftr-brand-sub {
                    font-size: 10px; font-weight: 600; letter-spacing: 0.18em;
                    text-transform: uppercase; color: #c9973a; margin-top: 2px;
                }

                .ftr-service-chip {
                    display: inline-flex; align-items: center; gap: 5px;
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 6px; padding: 5px 10px; font-size: 11.5px;
                    font-weight: 500; color: #64748b; margin: 3px 3px 3px 0;
                    transition: all 0.2s;
                }
                .ftr-service-chip:hover {
                    border-color: rgba(201,151,58,0.3);
                    color: #94a3b8;
                }

                .ftr-phone-num {
                    display: block;
                    font-variant-numeric: tabular-nums;
                    letter-spacing: 0.03em;
                }

                .ftr-designer-link {
                    color: #c9973a; text-decoration: none; font-weight: 600;
                    transition: opacity 0.2s;
                }
                .ftr-designer-link:hover { opacity: 0.8; }

                @media (max-width: 640px) {
                    .ftr-bottom { justify-content: center; text-align: center; }
                }
            `}</style>

            <div className="ftr-root">
                <div className="ftr-top-strip" />

                <div style={{ maxWidth: 1280, margin: "0 auto", padding: "60px 24px 0" }}>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "48px 40px",
                        marginBottom: 48,
                    }}>

                        {/* ── BRAND ── */}
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                <div style={{
                                    width: 44, height: 44,
                                    background: "linear-gradient(135deg, #c9973a, #e2b55a)",
                                    borderRadius: 12, display: "flex", alignItems: "center",
                                    justifyContent: "center", boxShadow: "0 4px 16px rgba(201,151,58,0.25)",
                                    flexShrink: 0,
                                }}>
                                    <FaGift size={18} color="#fff" />
                                </div>
                                <div>
                                    <div className="ftr-brand-name">RV Gift Shop</div>
                                    <div className="ftr-brand-sub">& Printing</div>
                                </div>
                            </div>

                            <p style={{ fontSize: 13.5, lineHeight: 1.75, color: "#475569", marginBottom: 20, maxWidth: 260 }}>
                                Crafting memories through premium gifts and bespoke printed products. Every order is handled with care and delivered with pride.
                            </p>

                            <div style={{ marginBottom: 24 }}>
                                <span className="ftr-service-chip"><FaGift size={9} color="#c9973a" /> Premium Gifts</span>
                                <span className="ftr-service-chip"><FaPrint size={9} color="#c9973a" /> Custom Printing</span>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                                {[
                                    { href: "https://www.facebook.com/share/1aQqqv6Ewg/", icon: <FaFacebookF size={13} />, label: "Facebook" },
                                    { href: "https://www.instagram.com/rv_gift_shop_and_printing/", icon: <FaInstagram size={13} />, label: "Instagram" },
                                    { href: "https://wa.me/918299519532", icon: <FaWhatsapp size={13} />, label: "WhatsApp" },
                                ].map(({ href, icon, label }) => (
                                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                                        aria-label={label} className="ftr-social">
                                        {icon}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* ── NAVIGATION ── */}
                        <div>
                            <p className="ftr-heading">Navigation</p>
                            <div className="ftr-divider" />
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                                {[
                                    { to: "/", label: "Home" },
                                    { to: "/products", label: "Products" },
                                    { to: "/cart", label: "Cart" },
                                    { to: "/orders", label: "My Orders" },
                                ].map(({ to, label }) => (
                                    <li key={to}>
                                        <Link to={to} className="ftr-link">
                                            <span className="ftr-dot" />
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* ── POLICIES ── */}
                        <div>
                            <p className="ftr-heading">Policies</p>
                            <div className="ftr-divider" />
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                                {[
                                    { to: "/privacy-policy", label: "Privacy Policy" },
                                    { to: "/terms-conditions", label: "Terms & Conditions" },
                                    { to: "/refund-policy", label: "Refund Policy" },
                                    { to: "/contact", label: "Contact Us" },
                                ].map(({ to, label }) => (
                                    <li key={to}>
                                        <Link to={to} className="ftr-link">
                                            <span className="ftr-dot" />
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* ── CONTACT ── */}
                        <div>
                            <p className="ftr-heading">Get In Touch</p>
                            <div className="ftr-divider" />
                            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                                {/* Address */}
                                <a
                                    href="https://maps.app.goo.gl/bpjDdpu4dJL3DcvT9"
                                    target="_blank" rel="noopener noreferrer"
                                    className="ftr-contact-row"
                                >
                                    <div className="ftr-contact-icon">
                                        <FaMapMarkerAlt size={11} color="#c9973a" />
                                    </div>
                                    <span>
                                        Gadhi Chowk, Dost Pur Road,<br />
                                        Shahzadpur, Akbarpur,<br />
                                        Ambedkar Nagar, UP – 224122
                                    </span>
                                </a>

                                {/* Phone — dono numbers alag alag properly formatted */}
                                <div className="ftr-contact-row" style={{ cursor: "default" }}>
                                    <div className="ftr-contact-icon">
                                        <FaPhoneAlt size={11} color="#c9973a" />
                                    </div>
                                    <div>
                                        <a href="tel:+918299519532"
                                            style={{ display: "block", color: "inherit", textDecoration: "none", transition: "color 0.2s", fontVariantNumeric: "tabular-nums", letterSpacing: "0.03em" }}
                                            onMouseEnter={e => e.target.style.color = "#c9973a"}
                                            onMouseLeave={e => e.target.style.color = "inherit"}>
                                            +91 82995 19532
                                        </a>
                                        <a href="tel:+919792770976"
                                            style={{ display: "block", color: "inherit", textDecoration: "none", transition: "color 0.2s", marginTop: 4, fontVariantNumeric: "tabular-nums", letterSpacing: "0.03em" }}
                                            onMouseEnter={e => e.target.style.color = "#c9973a"}
                                            onMouseLeave={e => e.target.style.color = "inherit"}>
                                            +91 97927 70976
                                        </a>
                                    </div>
                                </div>

                                {/* Email */}
                                <a href="mailto:officialrvgift@gmail.com" className="ftr-contact-row">
                                    <div className="ftr-contact-icon">
                                        <FaEnvelope size={11} color="#c9973a" />
                                    </div>
                                    officialrvgift@gmail.com
                                </a>

                            </div>
                        </div>

                    </div>

                    {/* ── BOTTOM BAR ── */}
                    <div className="ftr-bottom">
                        <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>
                            © {new Date().getFullYear()} RV Gift and Printing. All rights reserved.
                        </p>

                        <p className="ftr-tagline">Crafted with precision in India 🇮🇳</p>

                        <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>
                            Designed by{" "}
                            <a
                                href="https://www.linkedin.com/in/dhananjaypa"
                                target="_blank" rel="noopener noreferrer"
                                className="ftr-designer-link"
                            >
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