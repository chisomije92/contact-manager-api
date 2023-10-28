import { pool } from '../db.js';
import { CustomError } from './../utils/custom-error.js';
export const getUser = async (req, res, next) => {
    try {
        const query = 'SELECT * FROM users WHERE id = $1';
        const user = await pool.query(query, [req.userId]);
        if (!user) {
            // User not found, return an error
            const error = new CustomError("User not found!", 404);
            throw error;
        }
        const selectedUser = {
            id: user.rows[0].id,
            name: user.rows[0].name,
            email: user.rows[0].email
        };
        res.status(201).json(selectedUser);
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
//# sourceMappingURL=users.js.map