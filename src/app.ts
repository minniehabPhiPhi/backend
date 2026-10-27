import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors";
import { errorHandler } from "./middlewares/error.middleware";
import { jwtAuthen } from "./middlewares/jwt-auth.middleware";
import router from "./routes";

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(router);

// Keep the existing public API access; JWT checks apply to unmatched paths.
app.use(jwtAuthen);
app.use(errorHandler);

export default app;
