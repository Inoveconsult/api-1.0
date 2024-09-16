import 'dotenv/config';
import pg from "pg";

const pool = new pg.Pool({
  host: process.env.DBHOST,
  port: process.env.DBPORT,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.DBDATABASE
});

export default pool;