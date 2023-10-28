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
import { validationResult } from 'express-validator/src/validation-result.js';
import { pool } from '../db.js';
export const createContact = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, phoneNumber } = req.body;
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        const error = new CustomError("Validation failed, entered data is incorrect", 422, validationErrors.array());
        return res.status(error.statusCode).json({ message: error.message, errors: error.errors });
    }
    try {
        const findQuery = 'SELECT COUNT(*) FROM contacts WHERE phone_number = $1';
        const result = yield pool.query(findQuery, [phoneNumber]);
        const contactExists = result.rows[0].count > 0;
        if (contactExists) {
            const error = new CustomError("Contact exists already!", 409);
            throw error;
        }
        // Insert the contact into the database and return the created contact
        const insertQuery = 'INSERT INTO contacts (first_name, last_name, phone_number) VALUES ($1, $2, $3) RETURNING *';
        const { rows } = yield pool.query(insertQuery, [firstName, lastName, phoneNumber]);
        res.status(201).json(rows[0]);
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
});
export const updateContact = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName: updatedFirstName, lastName: updatedLastName, phoneNumber: updatedPhoneNumber } = req.body;
    const contactId = req.params.id;
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        const error = new CustomError("Validation failed, entered data is incorrect", 422, validationErrors.array());
        return res.status(error.statusCode).json({ message: error.message, errors: error.errors });
    }
    try {
        // search for contact 
        const findQuery = 'SELECT * FROM contacts WHERE id = $1';
        const result = yield pool.query(findQuery, [contactId]);
        if (result.rows.length === 0) {
            const error = new CustomError("Contact not found", 404);
            throw error;
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
        const { rows } = yield pool.query(updateQuery, [updatedContact.updatedFirstName, updatedContact.updatedLastName, updatedContact.updatedPhoneNumber, contactId]);
        if (rows.length === 0) {
            const error = new CustomError("Contact not found", 404);
            throw error;
        }
        else {
            res.status(200).json(rows[0]);
        }
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
});
//# sourceMappingURL=contacts.js.map