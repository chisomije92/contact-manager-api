import { CustomError } from "./../utils/custom-error.js";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { validationResult } from "express-validator/src/validation-result.js";
import jsonwebtoken from "jsonwebtoken";
import { pool } from "../db.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateRandomString,
} from "../utils/handle-tokens.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { sendEmail, sendResetEmail } from "../utils/sendEmail.js";

const { sign, verify } = jsonwebtoken;

dotenv.config();
const { REFRESH_SECRET } = process.env;
let refresh_secret: string;
if (REFRESH_SECRET) {
  refresh_secret = REFRESH_SECRET;
} else {
  throw new Error("jwt secret is not set");
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const error = new CustomError(
      "Validation failed, entered data is incorrect",
      422,
      validationErrors.array()
    );
    return res
      .status(error.statusCode)
      .json({ message: error.message, errors: error.errors });
  }

  const { email, password, name } = req.body;
  try {
    const query = "SELECT COUNT(*) FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);

    const userExists = result.rows[0].count > 0;
    if (userExists) {
      const error = new CustomError("User exists already!", 409);
      throw error;
    } else {
      // User doesn't exist, create and insert a new user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = {
        name,
        email,
        password: hashedPassword,
      };
      // generate token
      const verificationToken = generateRandomString(5);
      const verificationTokenExp = Date.now() + 600000; // 10 mins
      // Send a verification email
      await sendEmail(email, verificationToken);
      const insertQuery =
        "INSERT INTO users (email, name, password, verification_token, verification_token_exp) VALUES ($1, $2, $3, $4, $5) RETURNING *";
      const insertResult = await pool.query(insertQuery, [
        newUser.email,
        newUser.name,
        newUser.password,
        verificationToken,
        verificationTokenExp,
      ]);

      res
        .status(201)
        .json({
          message: "User created successfully. Proceed to verify email",
          tokenExpiration: insertResult.rows[0].verification_token_exp,
          id: insertResult.rows[0].id,
        });
    }
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const verificationToken = req.params.token;
    const query = "SELECT * FROM users WHERE verification_token = $1";
    const result = await pool.query(query, [verificationToken]);

    if (result.rows.length === 0) {
      const error = new CustomError("User not found", 404);
      throw error;
    }

    if (+result.rows[0].verification_token_exp < Date.now()) {
      const error = new CustomError(
        "The token has expired. Please get a new verification token",
        410
      );
      throw error;
    }

    if (!result.rows[0].verification_token) {
      const error = new CustomError(
        "Email is verified already. Proceed to login",
        409
      );
      throw error;
    }

    if (result.rows[0].is_verified) {
      const error = new CustomError("Not authorized!", 401);
      throw error;
    }
    const updateQuery =
      "UPDATE users SET is_verified = $1, verification_token=$2  WHERE verification_token = $3";
    await pool.query(updateQuery, [true, null, verificationToken]);
    const accessToken = generateAccessToken(
      result.rows[0].id,
      result.rows[0].email
    );
    const refreshToken = generateRefreshToken(
      result.rows[0].id,
      result.rows[0].email
    );
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
        domain: "*.cyclic.app",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
        domain: "*.onrender.com",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
        domain: "*.vercel.app",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      });
    res.status(201).json({ accessToken });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const updateVerificationToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    const query = "SELECT * FROM users WHERE id = $1";
    const result = await pool.query(query, [userId]);
    const userExists = result.rows.length > 0;
    if (!userExists) {
      const error = new CustomError("User not found", 404);
      throw error;
    } else {
      // generate token
      const newVerificationToken = generateRandomString(5);
      const newVerificationTokenExp = Date.now() + 600000; // 10 mins
      // Send a verification email
      await sendEmail(result.rows[0].email, newVerificationToken);
      const updateQuery =
        "UPDATE users SET verification_token=$1, verification_token_exp=$2  WHERE id = $3 RETURNING *";
      const updateResult = await pool.query(updateQuery, [
        newVerificationToken,
        newVerificationTokenExp,
        userId,
      ]);
      res
        .status(201)
        .json({
          message: "Verification code sent successfully",
          tokenExpiration: updateResult.rows[0].verification_token_exp,
        });
    }
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { oldPassword, newPassword } = req.body;
  const userEmail = req.params.email;
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const error = new CustomError(
      "Validation failed, entered data is incorrect",
      422,
      validationErrors.array()
    );
    return res
      .status(error.statusCode)
      .json({ message: error.message, errors: error.errors });
  }
  try {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(query, [userEmail]);
    const userExists = result.rows.length > 0;
    if (!userExists) {
      const error = new CustomError("User not found", 404);
      throw error;
    }
    const user = result.rows[0];
    const salt = await bcrypt.genSalt(10);
    const oldHashedPassword = await bcrypt.hash(oldPassword, salt);
    const isValid = await bcrypt.compare(oldPassword, user.password);
    // check if password is correct
    if (!isValid) {
      const error = new CustomError("Credentials are incorrect!", 403);
      throw error;
    }
    const isEqual = await bcrypt.compare(newPassword, oldHashedPassword);
    if (isEqual) {
      const error = new CustomError(
        "Old password is same as new password!",
        403
      );
      throw error;
    }
    const newHashedPassword = await bcrypt.hash(newPassword, salt);
    const updateQuery =
      "UPDATE users SET password=$1 WHERE email = $2 returning *";
    const updateResult = await pool.query(updateQuery, [
      newHashedPassword,
      userEmail,
    ]);
    const userObj = {
      id: updateResult.rows[0].id,
      email: updateResult.rows[0].email,
      name: updateResult.rows[0].name,
      is_verified: updateResult.rows[0].is_verified,
    };
    res.status(200).json(userObj);
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  try {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      const error = new CustomError("User not found", 404);
      throw error;
    }
    const passwordToken = generateRandomString(17, false);
    await sendResetEmail(email, passwordToken);
    const updateQuery =
      "UPDATE users SET forgot_password_token = $1 WHERE email = $2";
    await pool.query(updateQuery, [passwordToken, email]);
    res.status(201).json("Email sent to reset password");
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const finishResetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { password, confirmPassword } = req.body;
  const passwordToken = req.params.token;
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const error = new CustomError(
      "Validation failed, entered data is incorrect",
      422,
      validationErrors.array()
    );
    return res
      .status(error.statusCode)
      .json({ message: error.message, errors: error.errors });
  }
  try {
    const query = "SELECT * FROM users WHERE forgot_password_token = $1";
    const result = await pool.query(query, [passwordToken]);
    const userExists = result.rows.length > 0;
    if (!userExists) {
      const error = new CustomError("User not found", 404);
      throw error;
    }
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(password, salt);
    const isEqual = await bcrypt.compare(confirmPassword, newHashedPassword);
    if (!isEqual || confirmPassword !== password) {
      const error = new CustomError("Passwords do not match", 400);
      throw error;
    }
    const updateQuery =
      "UPDATE users SET password=$1, forgot_password_token = $2 WHERE forgot_password_token = $3 returning *";
    const updateResult = await pool.query(updateQuery, [
      newHashedPassword,
      null,
      passwordToken,
    ]);
    const accessToken = generateAccessToken(
      updateResult.rows[0].id,
      updateResult.rows[0].email
    );
    const refreshToken = generateRefreshToken(
      updateResult.rows[0].id,
      updateResult.rows[0].email
    );
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
        domain: "*.cyclic.app",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
        domain: "*.onrender.com",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
        domain: "*.vercel.app",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      });
    res.status(201).json({ accessToken });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const error = new CustomError(
      "Validation failed, entered data is incorrect",
      422,
      validationErrors.array()
    );
    return res
      .status(error.statusCode)
      .json({ message: error.message, errors: error.errors });
  }

  try {
    const query = "SELECT * FROM users WHERE email = $1";
    const user = await pool.query(query, [email]);

    if (!user.rowCount) {
      // User not found, return an error
      const error = new CustomError("User not found!", 404);
      throw error;
    }

    if (!user.rows[0].is_verified) {
      const error = new CustomError("Email not verified", 401);
      throw error;
    }
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      const error = new CustomError("Credentials are invalid!", 401);
      throw error;
    }
    if (user.rows[0].validation_token) {
      const updateQuery =
        "UPDATE users SET verification_token=$1 WHERE id = $2";
      await pool.query(updateQuery, [null, user.rows[0].id]);
    }
    const accessToken = generateAccessToken(
      user.rows[0].id,
      user.rows[0].email
    );
    const refreshToken = generateRefreshToken(
      user.rows[0].id,
      user.rows[0].email
    );
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
        domain: "*.cyclic.app",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
        domain: "*.onrender.com",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
        domain: "*.vercel.app",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      });
    res.status(201).json({ accessToken });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  verify(refreshToken, refresh_secret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Refresh the access token
    const accessToken = generateAccessToken(user.userId, user.email);
    res.json({ accessToken });
  });
};

export const validateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      const error = new CustomError("Credentials are invalid!", 401);
      throw error;
    }
    res.status(200).json("User validated!");
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    req.header("Authorization")?.replace("Bearer ", "");
    // Clear the refreshToken cookie by setting an expired date in the past
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
