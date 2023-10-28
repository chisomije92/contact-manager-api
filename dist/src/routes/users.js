import express from "express";
import isAuth from "../middlewares/is-auth.js";
import { getUser } from "../controllers/users.js";
const router = express.Router();
router.get("/", isAuth, getUser);
export default router;
//# sourceMappingURL=users.js.map