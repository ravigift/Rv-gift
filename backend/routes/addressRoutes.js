import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    verifyPincode,
} from "../controllers/addressController.js";

const router = express.Router();

// Pincode verify — no auth needed (public)
router.get("/pincode/:pin", verifyPincode);

// Address CRUD — auth required
router.use(protect);
router.get("/", getAddresses);
router.post("/", addAddress);
router.put("/:addressId", updateAddress);
router.delete("/:addressId", deleteAddress);
router.put("/:addressId/default", setDefaultAddress);

export default router;