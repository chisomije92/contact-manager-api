import { CustomError } from './../utils/custom-error.js';
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt"
import { validationResult } from 'express-validator/src/validation-result.js';
import { pool } from '../db.js';

export const createContact = async (req: Request, res: Response, next: NextFunction) => {
const {firstName, lastName, phoneNumber} = req.body
const validationErrors = validationResult(req)
if (!validationErrors.isEmpty()) {
    const error = new CustomError("Validation failed, entered data is incorrect", 422, validationErrors.array());
    return res.status(error.statusCode).json({ message: error.message, errors: error.errors })
  }

  try{
    const findQuery = 'SELECT COUNT(*) FROM contacts WHERE phone_number = $1';
    const result = await pool.query(findQuery, [phoneNumber]);

    const contactExists = result.rows[0].count > 0;
    if(contactExists){
        const error = new CustomError("Contact exists already!", 409)
        throw error
    }
    // Insert the contact into the database and return the created contact
    const insertQuery = 'INSERT INTO contacts (first_name, last_name, phone_number) VALUES ($1, $2, $3) RETURNING *';
    const { rows } = await pool.query(insertQuery, [firstName, lastName, phoneNumber]);
    res.status(201).json(rows[0]);
  }catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err)
}
}