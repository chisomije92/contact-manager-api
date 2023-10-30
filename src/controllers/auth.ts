import { CustomError } from './../utils/custom-error.js';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt"
import { validationResult } from 'express-validator/src/validation-result.js';
import jsonwebtoken from "jsonwebtoken"
import { pool } from '../db.js';
import { generateAccessToken, generateRefreshToken } from '../utils/handle-tokens.js';

const { sign, verify } = jsonwebtoken


dotenv.config()
const { REFRESH_SECRET } = process.env
let refresh_secret: string;
if (REFRESH_SECRET) {
  refresh_secret = REFRESH_SECRET;
} else {
  throw new Error("jwt secret is not set");
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const error = new CustomError("Validation failed, entered data is incorrect", 422, validationErrors.array());
    return res.status(error.statusCode).json({ message: error.message, errors: error.errors })
  }

  const { email, password, name } = req.body
  try {
    const query = 'SELECT COUNT(*) FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);

    const userExists = result.rows[0].count > 0;
    if (userExists) {
      const error = new CustomError("User exists already!", 409)
      throw error
    } else {
      // User doesn't exist, create and insert a new user
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)
      const newUser = {
        name,
        email,
        password: hashedPassword,

      }
      const insertQuery = 'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING id';
      const insertResult = await pool.query(insertQuery, [newUser.email, newUser.name, newUser.password]);
      const accessToken = generateAccessToken(insertResult.rows[0].id, insertResult.rows[0].email);
      const refreshToken = generateRefreshToken(insertResult.rows[0].id, insertResult.rows[0].email);
      res.status(201).json({ accessToken, refreshToken });
    }

  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const error = new CustomError("Validation failed, entered data is incorrect", 422, validationErrors.array());
    return res.status(error.statusCode).json({ message: error.message, errors: error.errors })
  }

  try {
    const query = 'SELECT * FROM users WHERE email = $1';
    const user = await pool.query(query, [email]);

    if (!user) {
      // User not found, return an error
      const error = new CustomError("User not found!", 404)
      throw error
    }
    const validPassword = await bcrypt.compare(password, user.rows[0].password)
    if (!validPassword) {
      const error = new CustomError("Credentials are invalid!", 401);
      console.log(error)
      throw error;

    }
    const accessToken = generateAccessToken(user.rows[0].id, user.rows[0].email);
    const refreshToken = generateRefreshToken(user.rows[0].id, user.rows[0].email);
    res.status(201).json({ accessToken, refreshToken });

  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err)
  }
}

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }

  verify(refreshToken, refresh_secret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Refresh the access token
    const accessToken = generateAccessToken(user.userId, user.email);
    res.json({ accessToken });
  });
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.header('Authorization')?.replace('Bearer ', '');
    console.log(req.header('Authorization')?.replace('Bearer ', ''))
    res.json({ message: 'Logged out successfully' });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err)
  }

}