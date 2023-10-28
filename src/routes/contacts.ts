import express from "express";
import { body } from "express-validator";
import { createContact, deleteContact, updateContact } from "../controllers/contacts.js";
import isAuth from "../middlewares/is-auth.js";

const router = express.Router();

router.post(
  "",
  [
    body("firstName").trim().isLength({ min: 1 }),
    body("lastName").trim().isLength({ min: 1 }),
    body("phoneNumber").trim().isLength({ min: 1 }),
  ],
  isAuth,
  createContact
);

router.put(
  "/:id",
  [
    body("firstName").trim().isLength({ min: 1 }).optional({ nullable: true, checkFalsy: true }),
    body("lastName").trim().isLength({ min: 1 }).optional({ nullable: true, checkFalsy: true }),
    body("phoneNumber").trim().isLength({ min: 1 }).optional({ nullable: true, checkFalsy: true }),
  ],
  isAuth,
  updateContact
);

router.delete(
  "/:id",
  isAuth,
  deleteContact
);


export default router