import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { CustomError } from "../utils/custom-error.js";
dotenv.config();
let secret;
if (process.env.ACCESS_SECRET) {
    secret = process.env.ACCESS_SECRET;
}
else {
    throw new Error("JWT_SECRET is not set");
}
export default (req, res, next) => {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
        const error = new CustomError("Not authenticated", 401);
        throw error;
        // throw error;
    }
    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, secret);
    }
    catch (err) {
        err.statusCode = 401;
        next(err);
    }
    if (!decodedToken) {
        const error = new CustomError("Not authenticated", 401);
        throw error;
    }
    req.userId = decodedToken.userId;
    next();
};
//# sourceMappingURL=is-auth.js.map