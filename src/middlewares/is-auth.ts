
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { CustomError } from "../utils/custom-error.js";

dotenv.config();
let secret: string;

if (process.env.ACCESS_SECRET) {
  secret = process.env.ACCESS_SECRET;
} else {
  throw new Error("JWT_SECRET is not set");
}

export default (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new CustomError("Not authenticated", 401);
    throw error
    // throw error;
  }
  const token: string = authHeader.split(" ")[1];
  let decodedToken: any;
  try {
    decodedToken = jwt.verify(token, secret);
  } catch (err: any) {
    err.statusCode = 401;
    next(err);
  }

  if (!decodedToken) {
    const error = new CustomError("Not authenticated", 401);
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
};