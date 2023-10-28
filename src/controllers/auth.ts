import { CustomError } from './../utils/custom-error.js';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt"
import { validationResult } from 'express-validator/src/validation-result.js';

import jsonwebtoken from "jsonwebtoken"
import { pool } from '../db.js';
import { generateAccessToken, generateRefreshToken } from '../utils/handle-tokens.js';

const { sign } = jsonwebtoken

dotenv.config()

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
            const accessToken = generateAccessToken(insertResult.rows[0].id);
            const refreshToken = generateRefreshToken(insertResult.rows[0].id);
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

  try{
    const query = 'SELECT * FROM users WHERE email = $1';
    const user = await pool.query(query, [email]);

    if (!user) {
      // User not found, return an error
      const error = new CustomError("User not found!", 404)
      throw error
    }
    const validPassword = await bcrypt.compare(password, user.rows[0].password)
    if (!validPassword) {
      const error = new CustomError("Credentials are invalid!", 400);
      throw error;

    }
    const accessToken = generateAccessToken(user.rows[0].id);
    const refreshToken = generateRefreshToken(user.rows[0].id);
    res.status(201).json({ accessToken, refreshToken });
    
  }catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err)
  }
}