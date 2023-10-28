import jsonwebtoken from "jsonwebtoken";
import dotenv from 'dotenv';
const { sign } = jsonwebtoken;
dotenv.config();
const { ACCESS_TOKEN, REFRESH_TOKEN } = process.env;
let access_secret, refresh_secret;
if (ACCESS_TOKEN && REFRESH_TOKEN) {
    access_secret = ACCESS_TOKEN;
    refresh_secret = REFRESH_TOKEN;
}
else {
    throw new Error("jwt secret is not set");
}
export function generateAccessToken(id) {
    return sign({ userId: id }, access_secret, { expiresIn: '15m' });
}
export const generateRefreshToken = (id) => {
    return sign({ userId: id }, refresh_secret, { expiresIn: '3d' });
};
//# sourceMappingURL=handle-tokens.js.map