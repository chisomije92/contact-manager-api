import express, { Application, } from "express";
import dotenv from 'dotenv';


dotenv.config();

export const app: Application = express();
export const port = process.env.PORT || 8000;

app.use(express.json())