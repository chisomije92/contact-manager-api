var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { pool } from '../db.js';
import { CustomError } from './../utils/custom-error.js';
export const getUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = 'SELECT * FROM users WHERE id = $1';
        const user = yield pool.query(query, [req.userId]);
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
});
//# sourceMappingURL=users.js.map