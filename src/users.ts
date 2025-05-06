import { hash, randomBytes } from "crypto";
import { getDB } from "./utils.js"
import { User } from "./schema.js";
import { env } from "process";

const DEBUG = env.DEBUG;

export const addUser = (
  name: string,
  email: string,
  password: string):
  Promise<string[]> => {
  DEBUG && console.debug('adding user', name, email, password)
  const db = getDB();
  const hPassword = hash('sha256', password);
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`INSERT INTO users (name, email, phash) 
            VALUES (?, ?, ?);`, [name, email, hPassword],
        (err: Error) => {
          db.close()
          if (err) reject(err)
          else resolve([name, email])
          return
        }
      )
    })
  })
}

export const getUser = (email: string): Promise<User> => {
  const db = getDB()
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get(`SELECT * FROM users WHERE email=?`, [email],
        (err: Error, row: User) => {
          db.close()
          if (err) reject(err)
          else resolve(row);
          return
        }
      )
    })
  })
}

export const validateUser = (email: string, password: string | null): Promise<Boolean> => {
  // pass the password as null and it will test if the user exists or not
  DEBUG && console.debug('validating user', email, password)
  const db = getDB();
  const hPassword = password ? hash('sha256', new Buffer(password)) : '';
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT phash FROM users WHERE email = ?',
      [email],
      (err, row: { phash: string }) => {
        db.close();
        DEBUG && console.debug(password);
        if (err) {
          console.error('Database error:', err);
          reject(err);
        }
        else resolve(password ? hPassword === row.phash : Boolean(row))
        return;
      }
    );
  })
}

export const initUserSession = (email: string): Promise<string[]> => {
  // session mechanism works like this
  const newKey = randomBytes(50).toString('base64url');
  const db = getDB();

  return new Promise((resolve, reject) => {
    db.serialize(() => db.run(
      'UPDATE users SET sessionKey=?,sco=?,tte=? WHERE email=?',
      [newKey, new Date().valueOf(), 3600 * 1000, email],
      (err: Error) => {
        db.close()
        err ?
          reject(err) :
          resolve([email, newKey])
        return;
      }
    ))
  })

}

export const validateSession = (email: string, key: string): Promise<Boolean> => {
  const db = getDB();
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get('SELECT sessionKey,sco,tte FROM users WHERE email=?', [email],
        (err: Error,
          row: {
            sessionKey: string,
            sco: number,
            tte: number
          }) => {
          if (err) reject(err)
          else {
            const { sessionKey, sco, tte } = row;
            const expired = tte < (new Date().valueOf()) - sco;
            resolve(sessionKey === key && !expired);
          }
          return;
        }
      )
    })
  })
}
