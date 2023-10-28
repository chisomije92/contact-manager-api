import express from "express";
import { register } from "../controllers/auth.js";
import { body } from "express-validator";


const router = express.Router();

router.post(
    "/register",
    [
      body("name").trim().isLength({ min: 4 }),
      body("email").isEmail().normalizeEmail().isLength({ max: 50 }),
      body("password").isLength({ min: 5 }),
    ],
    register
  
  );

  export default router;