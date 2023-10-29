import express from "express";
import dotenv from 'dotenv';
dotenv.config();
export const app = express();
export const port = process.env.PORT || 8000;
app.use(express.json());
//# sourceMappingURL=app.js.map