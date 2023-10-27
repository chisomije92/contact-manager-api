import express, { Express, Request, Response , Application } from 'express';
import dotenv from 'dotenv';
import { createTables } from './db.js';
import cors from 'cors';

//For env File 
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;

createTables();


app.use(cors<Request>())
app.use(express.json())

app.get('/', (req: Request, res: Response) => {
  res.send('API is running');
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});