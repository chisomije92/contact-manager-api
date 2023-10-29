import { createTables } from './db.js';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoute from "./routes/auth.js";
import contactRoute from "./routes/contacts.js";
import userRoute from "./routes/users.js";
import { app, port } from './app.js';
createTables();
app.use(cors());
app.use(helmet({
    crossOriginEmbedderPolicy: false,
}));
app.use(morgan("common"));
app.get('/', (req, res) => {
    res.send('API is running');
});
app.use("/api/auth", authRoute);
app.use("/api/contacts", contactRoute);
app.use("/api/user", userRoute);
app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({ message: message });
});
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map