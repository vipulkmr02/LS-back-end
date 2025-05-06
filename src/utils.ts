
import { env, loadEnvFile } from "process"
import slt from "sqlite3";

// a func to return the Database instance of sqlite3
// opening db from env.DBLOC variable 
export const getDB = () => {
  loadEnvFile('.env');
  return new slt.Database(env.DBLOC!)
}
