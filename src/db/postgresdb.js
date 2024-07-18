import pgp from "pg-promise";
import { PG_DB_NAME } from "../constants.js";
import createTables from "./initPgjs";

const constring = `${process.env.PG_URL}/${PG_DB_NAME}`;
const db = pgp()(constring);

const connectToPg = async () => {
  try {
    const obj = await db.connect();
    console.log(`Connected to PostgreSQL ${obj.client.host}`);
    obj.done();
    await createTables(db);
  } catch (error) {
    console.error("Error connecting to PostgreSQL", error);
    process.exit(1);
  }
};

export { connectToPg, db };

// import pgp from "pg-promise";
// import { PG_DB_NAME } from "../constants.js";
// import createTables from "./initPgjs";
// const connectToPg = async () => {
//   const constring = `${process.env.PG_URL}/${PG_DB_NAME}`;
//   const pg = pgp()(constring);

//   try {
//     const obj = await pg.connect();
//     console.log(`Connected to PostgreSQL ${obj.client.host}`);
//     obj.done();
//     await createTables(pg);
//   } catch (error) {
//     console.error("Error connecting to PostgreSQL", error);
//     process.exit(1);
//   }
// };
// export { connectToPg };
