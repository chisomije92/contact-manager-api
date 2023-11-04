import express from "express";
import { changePassword, login, logout, refreshToken, register, verifyUser } from "../controllers/auth.js";
import { body } from "express-validator";
import { updateVerificationToken } from '../controllers/auth.js';
const router = express.Router();
router.post("/register", [
    body("name").trim().isLength({ min: 4 }),
    body("email").isEmail().normalizeEmail().isLength({ max: 50 }),
    body("password").isLength({ min: 5 }),
], register);
router.post("/login", [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 5 }),
], login);
router.get("/refresh-token", refreshToken);
router.post('/change-password/:email', changePassword);
router.post('/verify-user/:token', verifyUser);
router.post('/update-token/:token', updateVerificationToken);
router.post("/logout", logout);
export default router;
//# sourceMappingURL=auth.js.map