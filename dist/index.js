import express from 'express';
import dotenv from 'dotenv';
import { createTables } from './db.js';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoute from "./routes/auth.js";
//For env File 
dotenv.config();
const app = express();
const port = process.env.PORT || 8000;
createTables();
app.use(cors());
app.use(express.json());
app.use(helmet({
    crossOriginEmbedderPolicy: false,
}));
app.use(morgan("common"));
const blacklistedTokens = new Set();
// Middleware to check if a token is blacklisted
app.use((req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (blacklistedTokens.has(token)) {
        return res.status(401).json({ message: 'Token blacklisted' });
    }
    next();
});
app.get('/', (req, res) => {
    res.send('API is running');
});
app.use("/api/auth", authRoute);
app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({ message: message });
});
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map