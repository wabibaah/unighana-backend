import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import { dbConnect } from "./config/dbConnect.js";
import authRouter from "./routes/authRoutes.js";

import { notFound, errorHandler } from "./middlewares/errorHandler.js";

const app = express();
dotenv.config();

dbConnect();

// he is using body parser too
// app.use(bodyParser.json()) and app.use(bodyParser.urlencoded({extended: false}))
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/user", authRouter);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
});
