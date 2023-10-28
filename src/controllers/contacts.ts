import { CustomError } from './../utils/custom-error.js';
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt"
import { validationResult } from 'express-validator/src/validation-result.js';
import { pool } from '../db.js';

export const createContact = async (req: Request, res: Response, next: NextFunction) => {
    const { firstName, lastName, phoneNumber } = req.body
    const validationErrors = validationResult(req)
    if (!validationErrors.isEmpty()) {
        const error = new CustomError("Validation failed, entered data is incorrect", 422, validationErrors.array());
        return res.status(error.statusCode).json({ message: error.message, errors: error.errors })
    }

    try {
        const findQuery = 'SELECT COUNT(*) FROM contacts WHERE phone_number = $1';
        const result = await pool.query(findQuery, [phoneNumber]);

        const contactExists = result.rows[0].count > 0;
        if (contactExists) {
            const error = new CustomError("Contact exists already!", 409)
            throw error
        }
        // Insert the contact into the database and return the created contact
        const insertQuery = 'INSERT INTO contacts (first_name, last_name, phone_number) VALUES ($1, $2, $3) RETURNING *';
        const { rows } = await pool.query(insertQuery, [firstName, lastName, phoneNumber]);
        res.status(201).json(rows[0]);
    } catch (err: any) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err)
    }
}

export const updateContact = async (req: Request, res: Response, next: NextFunction) => {
    const { firstName: updatedFirstName, lastName: updatedLastName, phoneNumber: updatedPhoneNumber } = req.body
    const contactId = req.params.id;
    const validationErrors = validationResult(req)
    if (!validationErrors.isEmpty()) {
        const error = new CustomError("Validation failed, entered data is incorrect", 422, validationErrors.array());
        return res.status(error.statusCode).json({ message: error.message, errors: error.errors })
    }
    try {
        // search for contact 
        const findQuery = 'SELECT * FROM contacts WHERE id = $1';
        const result = await pool.query(findQuery, [contactId]);

        if (result.rows.length === 0) {
            const error = new CustomError("Contact not found", 404)
            throw error
        }

        // Merge the updated fields with the existing contact data
        const currentContact = result.rows[0];
        const updatedContact = {
            updatedFirstName: updatedFirstName || currentContact.first_name,
            updatedLastName: updatedLastName || currentContact.last_name,
            updatedPhoneNumber: updatedPhoneNumber || currentContact.phone_number,
        };
        // Update the contact in the database and return the updated contact
        const updateQuery = 'UPDATE contacts SET first_name = $1, last_name = $2, phone_number = $3 WHERE id = $4 RETURNING *';
        const { rows } = await pool.query(updateQuery, [updatedContact.updatedFirstName, updatedContact.updatedLastName, updatedContact.updatedPhoneNumber, contactId]);
        if (rows.length === 0) {
            const error = new CustomError("Contact not found", 404)
            throw error

        } else {
            res.status(200).json(rows[0]);
        }
    } catch (err: any) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err)
    }
}