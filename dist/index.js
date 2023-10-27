import express from 'express';
import dotenv from 'dotenv';
import { createTables } from './db.js';
import cors from 'cors';
//For env File 
dotenv.config();
const app = express();
const port = process.env.PORT || 8000;
createTables();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res.send('API is running');
});
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map