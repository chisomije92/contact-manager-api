import jsonwebtoken from "jsonwebtoken";
import dotenv from 'dotenv';
const { sign } = jsonwebtoken;
dotenv.config();
const { ACCESS_SECRET, REFRESH_SECRET } = process.env;
let access_secret, refresh_secret;
if (ACCESS_SECRET && REFRESH_SECRET) {
    access_secret = ACCESS_SECRET;
    refresh_secret = REFRESH_SECRET;
}
else {
    throw new Error("jwt secret is not set");
}
export function generateAccessToken(id, email) {
    return sign({ email, userId: id }, access_secret, { expiresIn: '15m' });
}
export const generateRefreshToken = (id, email) => {
    return sign({ email, userId: id }, refresh_secret, { expiresIn: '7d' });
};
//# sourceMappingURL=handle-tokens.js.map