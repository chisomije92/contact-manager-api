import express from "express";
import { body } from "express-validator";
import { createContact } from "../controllers/contacts.js";
import isAuth from "../middlewares/is-auth.js";
const router = express.Router();
router.post("", [
    body("firstName").trim().isLength({ min: 1 }),
    body("lastName").trim().isLength({ min: 1 }),
    body("phoneNumber").trim().isLength({ min: 1 }),
], isAuth, createContact);
export default router;
//# sourceMappingURL=contacts.js.map