var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CustomError } from './../utils/custom-error.js';
import dotenv from 'dotenv';
import bcrypt from "bcrypt";
import { validationResult } from 'express-validator/src/validation-result.js';
import jsonwebtoken from "jsonwebtoken";
import { pool } from '../db.js';
import { generateAccessToken, generateRefreshToken } from '../utils/handle-tokens.js';
const { sign, verify } = jsonwebtoken;
dotenv.config();
const { REFRESH_SECRET } = process.env;
let refresh_secret;
if (REFRESH_SECRET) {
    refresh_secret = REFRESH_SECRET;
}
else {
    throw new Error("jwt secret is not set");
}
export const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        const error = new CustomError("Validation failed, entered data is incorrect", 422, validationErrors.array());
        return res.status(error.statusCode).json({ message: error.message, errors: error.errors });
    }
    const { email, password, name } = req.body;
    try {
        const query = 'SELECT COUNT(*) FROM users WHERE email = $1';
        const result = yield pool.query(query, [email]);
        const userExists = result.rows[0].count > 0;
        if (userExists) {
            const error = new CustomError("User exists already!", 409);
            throw error;
        }
        else {
            // User doesn't exist, create and insert a new user
            const salt = yield bcrypt.genSalt(10);
            const hashedPassword = yield bcrypt.hash(password, salt);
            const newUser = {
                name,
                email,
                password: hashedPassword,
            };
            const insertQuery = 'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING id';
            const insertResult = yield pool.query(insertQuery, [newUser.email, newUser.name, newUser.password]);
            const accessToken = generateAccessToken(insertResult.rows[0].id);
            const refreshToken = generateRefreshToken(insertResult.rows[0].id);
            res.status(201).json({ accessToken, refreshToken });
        }
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
});
export const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        const error = new CustomError("Validation failed, entered data is incorrect", 422, validationErrors.array());
        return res.status(error.statusCode).json({ message: error.message, errors: error.errors });
    }
    try {
        const query = 'SELECT * FROM users WHERE email = $1';
        const user = yield pool.query(query, [email]);
        if (!user) {
            // User not found, return an error
            const error = new CustomError("User not found!", 404);
            throw error;
        }
        const validPassword = yield bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            const error = new CustomError("Credentials are invalid!", 400);
            throw error;
        }
        const accessToken = generateAccessToken(user.rows[0].id);
        const refreshToken = generateRefreshToken(user.rows[0].id);
        res.status(201).json({ accessToken, refreshToken });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
});
export const refreshToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token is required' });
    }
    verify(refreshToken, refresh_secret, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }
        // Refresh the access token
        const accessToken = generateAccessToken(user.userId);
        res.json({ accessToken });
    });
});
export const logout = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    res.json({ message: 'Logged out successfully' });
});
//# sourceMappingURL=auth.js.map