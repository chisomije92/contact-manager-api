import jsonwebtoken from "jsonwebtoken"
import dotenv from 'dotenv';

const { sign } = jsonwebtoken

dotenv.config();

const { ACCESS_SECRET, REFRESH_SECRET } = process.env
let access_secret: string, refresh_secret: string;
if (ACCESS_SECRET  && REFRESH_SECRET) {
    access_secret = ACCESS_SECRET;
    refresh_secret = REFRESH_SECRET;
} else {
  throw new Error("jwt secret is not set");
}

export function generateAccessToken(id: string) {
  return sign({ userId: id }, access_secret, { expiresIn: '15m' });
}

export const generateRefreshToken = (id: string) => {
  return sign({ userId: id }, refresh_secret, { expiresIn: '3d' });
}