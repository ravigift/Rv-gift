import SiteSection from "../models/SiteSection.js";

/* Keys the storefront is allowed to read/write. Anything else → 404. */
const ALLOWED_KEYS = new Set(["how-it-works"]);

const str = (v, max) => String(v ?? "").trim().slice(0, max);

/* Per-key sanitiser. Returns the cleaned `data` object to persist. */
const sanitisers = {
    "how-it-works": (raw = {}) => {
        const steps = Array.isArray(raw.steps) ? raw.steps.slice(0, 6) : [];
        return {
            eyebrow: str(raw.eyebrow, 60),
            heading: str(raw.heading, 120),
            subheading: str(raw.subheading, 240),
            steps: steps
                .map((s, i) => ({
                    icon: str(s.icon, 8) || "✨",
                    label: str(s.label, 6) || String(i + 1).padStart(2, "0"),
                    title: str(s.title, 80),
                    desc: str(s.desc, 240),
                }))
                .filter((s) => s.title || s.desc),
        };
    },
};

/* ─────────────────────────────────────────────
   GET /api/site/:key   (PUBLIC)
   Always 200 for a known key — `data` is null when
   nothing is configured yet, so the client just uses
   its built-in defaults without logging an error.
───────────────────────────────────────────── */
export const getSection = async (req, res) => {
    try {
        const key = String(req.params.key || "").toLowerCase();
        if (!ALLOWED_KEYS.has(key))
            return res.status(404).json({ success: false, message: "Unknown section" });

        const doc = await SiteSection.findOne({ key }).lean();
        return res.json({
            success: true,
            key,
            data: doc?.data ?? null,
            updatedAt: doc?.updatedAt ?? null,
        });
    } catch (error) {
        console.error("GET SITE SECTION ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to load section" });
    }
};

/* ─────────────────────────────────────────────
   PUT /api/site/:key   (ADMIN)
   body: { data: {...} }
───────────────────────────────────────────── */
export const upsertSection = async (req, res) => {
    try {
        const key = String(req.params.key || "").toLowerCase();
        if (!ALLOWED_KEYS.has(key))
            return res.status(404).json({ success: false, message: "Unknown section" });

        const clean = sanitisers[key](req.body?.data || {});

        const doc = await SiteSection.findOneAndUpdate(
            { key },
            { $set: { data: clean, updatedBy: req.user?._id } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();

        return res.json({ success: true, key, data: doc.data, updatedAt: doc.updatedAt });
    } catch (error) {
        console.error("UPSERT SITE SECTION ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to save section" });
    }
};
