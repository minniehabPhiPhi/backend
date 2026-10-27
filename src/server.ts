import app from "./app";
import { env } from "./config/env";
import { ensureSchema } from "./config/schema";

ensureSchema()
  .then(() => console.log("Database tables ready"))
  .catch((error) => console.error("Could not prepare database tables:", error));

app.listen(env.port, () => {
  console.log(`API running at http://localhost:${env.port}`);
});
