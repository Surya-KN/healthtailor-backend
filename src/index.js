import dotenv from "dotenv";
import { connectToMongo } from "./db/mongodb.js";
import { connectToPg } from "./db/postgresdb.js";
import app from "./app.js";

dotenv.config({
  path: "../.env",
});

const startServer = async () => {
  try {
    await connectToPg();
    await connectToMongo();
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server started on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start the server", error);
    process.exit(1);
  }
};

startServer();
