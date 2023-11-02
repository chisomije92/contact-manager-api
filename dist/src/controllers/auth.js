import { CustomError } from './../utils/custom-error.js';
import dotenv from 'dotenv';
import bcrypt from "bcrypt";
import { validationResult } from 'express-validator/src/validation-result.js';
import jsonwebtoken from "jsonwebtoken";
import { pool } from '../db.js';
import { generateAccessToken, generateRefreshToken, generateRandomString } from '../utils/handle-tokens.js';
import { sendEmail } from '../utils/sendEmail.js';
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
export const register = async (req, res, next) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        const error = new CustomError("Validation failed, entered data is incorrect", 422, validationErrors.array());
        return res.status(error.statusCode).json({ message: error.message, errors: error.errors });
    }
    const { email, password, name } = req.body;
    try {
        const query = 'SELECT COUNT(*) FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        const userExists = result.rows[0].count > 0;
        if (userExists) {
            const error = new CustomError("User exists already!", 409);
            throw error;
        }
        else {
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
            const insertQuery = 'INSERT INTO users (email, name, password, verification_token, verification_token_exp) VALUES ($1, $2, $3, $4, $5) RETURNING id';
            await pool.query(insertQuery, [newUser.email, newUser.name, newUser.password, verificationToken, verificationTokenExp]);
            res.status(201).json("User created successfully. Proceed to verify email");
        }
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
export const verifyUser = async (req, res, next) => {
    try {
        const verificationToken = req.params.token;
        const query = 'SELECT * FROM users WHERE verification_token = $1';
        const result = await pool.query(query, [verificationToken]);
        if (result.rows.length === 0) {
            const error = new CustomError("User not found", 404);
            throw error;
        }
        if (+result.rows[0].verification_token_exp < Date.now()) {
            const error = new CustomError("The token has expired. Please get a new verification token", 410);
            throw error;
        }
        if (!result.rows[0].verification_token) {
            const error = new CustomError("Email is verified already. Proceed to login", 409);
            throw error;
        }
        if (result.rows[0].is_verified) {
            const error = new CustomError("Not authorized!", 401);
            throw error;
        }
        const updateQuery = 'UPDATE users SET is_verified = true, verification_token=null  WHERE verification_token = $1';
        await pool.query(updateQuery, [verificationToken]);
        const accessToken = generateAccessToken(result.rows[0].id, result.rows[0].email);
        const refreshToken = generateRefreshToken(result.rows[0].id, result.rows[0].email);
        res.cookie('refreshToken', refreshToken, { httpOnly: true });
        res.status(201).json({ accessToken });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
export const updateVerificationToken = async (req, res, next) => {
    try {
        const oldVerificationToken = req.params.token;
        const query = 'SELECT * FROM users WHERE verification_token = $1';
        const result = await pool.query(query, [oldVerificationToken]);
        const userExists = result.rows.length > 0;
        if (!userExists) {
            const error = new CustomError("User not found", 404);
            throw error;
        }
        else {
            // generate token
            const newVerificationToken = generateRandomString(5);
            const newVerificationTokenExp = Date.now() + 600000; // 10 mins
            // Send a verification email
            await sendEmail(result.rows[0].email, newVerificationToken);
            const updateQuery = 'UPDATE users SET verification_token=$1, verification_token_exp=$2  WHERE verification_token = $3 returning *';
            const updateResult = await pool.query(updateQuery, [newVerificationToken, newVerificationTokenExp, oldVerificationToken]);
            const accessToken = generateAccessToken(updateResult.rows[0].id, updateResult.rows[0].email);
            const refreshToken = generateRefreshToken(updateResult.rows[0].id, updateResult.rows[0].email);
            res.cookie('refreshToken', refreshToken, { httpOnly: true });
            res.status(201).json({ accessToken });
        }
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
export const login = async (req, res, next) => {
    const { email, password } = req.body;
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        const error = new CustomError("Validation failed, entered data is incorrect", 422, validationErrors.array());
        return res.status(error.statusCode).json({ message: error.message, errors: error.errors });
    }
    try {
        const query = 'SELECT * FROM users WHERE email = $1';
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
            console.log(error);
            throw error;
        }
        const accessToken = generateAccessToken(user.rows[0].id, user.rows[0].email);
        const refreshToken = generateRefreshToken(user.rows[0].id, user.rows[0].email);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(201).json({ accessToken });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
export const refreshToken = async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token is required' });
    }
    verify(refreshToken, refresh_secret, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }
        // Refresh the access token
        const accessToken = generateAccessToken(user.userId, user.email);
        res.json({ accessToken });
    });
};
export const logout = async (req, res, next) => {
    try {
        req.header('Authorization')?.replace('Bearer ', '');
        res.json({ message: 'Logged out successfully' });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
//# sourceMappingURL=auth.js.map