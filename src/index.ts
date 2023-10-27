import express, { Express, Request, Response , Application, NextFunction } from 'express';
import dotenv from 'dotenv';
import { createTables } from './db.js';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

//For env File 
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;

createTables();


app.use(cors<Request>())
app.use(express.json())
app.use(helmet({
    crossOriginEmbedderPolicy: false,
  
  }))
  app.use(morgan("common"))

app.get('/', (req: Request, res: Response) => {
  res.send('API is running');
});

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({ message: message });
  });

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});