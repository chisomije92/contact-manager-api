import jsonwebtoken from "jsonwebtoken"
import dotenv from 'dotenv';
import crypto from "crypto"

const { sign } = jsonwebtoken

dotenv.config();



const { ACCESS_SECRET, REFRESH_SECRET } = process.env
let access_secret: string, refresh_secret: string;






if (ACCESS_SECRET && REFRESH_SECRET) {
  access_secret = ACCESS_SECRET;
  refresh_secret = REFRESH_SECRET;
} else {
  throw new Error("jwt secret is not set");
}

export const generateRandomString = (length: number) => {
  const characters = '0123456789';
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

export function generateAccessToken(id: string, email: string) {
  return sign({ email, userId: id }, access_secret, { expiresIn: '15m' });
}

export const generateRefreshToken = (id: string, email: string) => {
  return sign({ email, userId: id }, refresh_secret, { expiresIn: '7d' });
}