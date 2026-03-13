import { useEffect } from "react";

export default function RefundPolicy() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#fdf8f3]">
            {/* Header */}
            <div className="bg-white border-b border-amber-100 py-12">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <p className="text-amber-600 text-sm font-medium tracking-widest uppercase mb-3">Legal</p>
                    <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Cancellation &amp; Refund Policy
                    </h1>
                    <p className="mt-3 text-gray-500 text-sm">Last updated: June 2025</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-amber-50 p-8 md:p-12 space-y-10">

                    {/* Quick Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SummaryCard icon="❌" title="No Returns" desc="We do not accept returns after delivery" />
                        <SummaryCard icon="💰" title="Refunds" desc="Only on cancellation before packing" />
                    </div>

                    {/* Important Notice */}
                    <div className="bg-red-50 border-l-4 border-red-400 rounded-r-xl p-4 text-sm text-gray-700">
                        <strong>Important:</strong> RV Gift and Printing does <strong>not</strong> accept returns or exchanges once an order has been delivered. Please read our cancellation policy carefully before placing your order.
                    </div>

                    <Section title="1. Our Policy">
                        <p>At RV Gift and Printing, we take great care in packaging and delivering your orders. However, we do <strong>not</strong> offer a return or exchange facility once the order has been delivered to you.</p>
                        <p>We encourage all customers to review their order carefully before confirming the purchase.</p>
                    </Section>

                    <Section title="2. Order Cancellation">
                        <p>You may cancel your order <strong>only if the order has not yet been packed</strong>. Once packing begins, cancellation is no longer possible.</p>
                        <p>To request a cancellation:</p>
                        <ol>
                            <li>Contact us immediately at <strong>officialrvgift@gmail.com</strong> or call <strong>+91 82995 19532</strong></li>
                            <li>Provide your Order ID and reason for cancellation</li>
                            <li>Our team will check the current packing status of your order</li>
                            <li>If the order has not been packed yet, cancellation will be approved and a full refund will be initiated</li>
                        </ol>
                    </Section>

                    <Section title="3. When Cancellation is NOT Possible">
                        <p>Cancellation requests will be rejected in the following cases:</p>
                        <ul>
                            <li>The order has already been packed</li>
                            <li>The order has been handed over to the courier/delivery partner</li>
                            <li>The order has already been delivered</li>
                        </ul>
                        <p>In such cases, no refund will be issued.</p>
                    </Section>

                    <Section title="4. Refund Process">
                        <p>If your cancellation request is approved (i.e., order was not yet packed):</p>
                        <ul>
                            <li>A <strong>full refund</strong> will be issued to your original payment method</li>
                            <li>Refunds are processed within <strong>5–7 business days</strong></li>
                            <li>UPI and wallet payments are typically refunded faster (1–3 business days)</li>
                            <li>Bank processing may add an additional 2–5 business days depending on your bank</li>
                        </ul>
                    </Section>

                    <Section title="5. Damaged or Wrong Item Delivered">
                        <p>While we do not have a return policy, if you receive a <strong>damaged</strong> or <strong>completely wrong</strong> item, please contact us within <strong>24 hours</strong> of delivery with:</p>
                        <ul>
                            <li>Your Order ID</li>
                            <li>Clear photos of the item received</li>
                        </ul>
                        <p>We will review such cases individually and resolve them at our discretion. Resolution may include a replacement or partial/full refund depending on the situation.</p>
                    </Section>

                    <Section title="6. No Returns Policy">
                        <p>We strictly do <strong>not</strong> accept returns for:</p>
                        <ul>
                            <li>Change of mind after delivery</li>
                            <li>Customized or personalized items</li>
                            <li>Items that have been used or opened</li>
                            <li>Delay in delivery due to courier partner or external factors</li>
                        </ul>
                    </Section>

                    <Section title="7. Contact Us">
                        <p>For cancellation requests or any refund-related queries, contact us as soon as possible:</p>
                        <ContactBox />
                    </Section>

                </div>
            </div>
        </div>
    );
}

function SummaryCard({ icon, title, desc }) {
    return (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="font-semibold text-gray-800 text-sm">{title}</div>
            <div className="text-gray-500 text-xs mt-1">{desc}</div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                {title}
            </h2>
            <div className="text-gray-600 leading-relaxed space-y-3 [&_ul]:mt-2 [&_ul]:space-y-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5">
                {children}
            </div>
        </div>
    );
}

function ContactBox() {
    return (
        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-5 text-sm text-gray-700 space-y-1">
            <p><strong>RV Gift and Printing</strong></p>
            <p>Email: officialrvgift@gmail.com</p>
            <p>Phone: +91 82995 19532</p>
            <p>Gadri chowk Dostpur chauraha, Akbarpur</p>
            <p>Ambedkar Nagar – 224122, Uttar Pradesh, India</p>
            <p>GSTIN: 09AOHPV4034Q3Z3</p>
        </div>
    );
}