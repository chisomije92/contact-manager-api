import { CustomError } from './../utils/custom-error.js';
import { validationResult } from 'express-validator/src/validation-result.js';
import { pool } from '../db.js';
export const createContact = async (req, res, next) => {
    const { firstName, lastName, phoneNumber } = req.body;
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        const error = new CustomError("Validation failed, entered data is incorrect", 422, validationErrors.array());
        return res.status(error.statusCode).json({ message: error.message, errors: error.errors });
    }
    try {
        const findQuery = 'SELECT COUNT(*) FROM contacts WHERE phone_number = $1';
        const result = await pool.query(findQuery, [phoneNumber]);
        const contactExists = result.rows[0].count > 0;
        if (contactExists) {
            const error = new CustomError("Contact exists already!", 409);
            throw error;
        }
        // Insert the contact into the database and return the created contact
        const insertQuery = 'INSERT INTO contacts (first_name, last_name, phone_number) VALUES ($1, $2, $3) RETURNING *';
        const { rows } = await pool.query(insertQuery, [firstName, lastName, phoneNumber]);
        res.status(201).json(rows[0]);
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
export const updateContact = async (req, res, next) => {
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
        const result = await pool.query(findQuery, [contactId]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: "Contact not found" });
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
            res.status(404).json({ message: "Contact not found" });
        }
        else {
            res.status(200).json({ message: "Contact updated successfully!", contact: rows[0] });
        }
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
export const deleteContact = async (req, res, next) => {
    const contactId = req.params.id;
    try {
        // Get the current contact information from the database
        const selectQuery = 'SELECT * FROM contacts WHERE id = $1';
        const { rows } = await pool.query(selectQuery, [contactId]);
        if (rows.length === 0) {
            const error = new CustomError("Contact not found", 404);
            throw error;
        }
        // Delete the contact from the database and return the deleted contact
        const deleteQuery = 'DELETE FROM contacts WHERE id = $1 RETURNING *';
        const { rows: deletedRows } = await pool.query(deleteQuery, [contactId]);
        res.status(200).json(deletedRows[0]);
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
export const getContact = async (req, res, next) => {
    const contactId = req.params.id;
    try {
        // Query the database to retrieve the contact by ID
        const selectQuery = 'SELECT * FROM contacts WHERE id = $1';
        const { rows } = await pool.query(selectQuery, [contactId]);
        if (rows.length === 0) {
            const error = new CustomError("Contact not found", 404);
            throw error;
        }
        res.status(200).json(rows);
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
export const getContacts = async (req, res, next) => {
    try {
        // Retrieve all contacts from the database
        const query = 'SELECT * FROM contacts';
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
//# sourceMappingURL=contacts.js.map