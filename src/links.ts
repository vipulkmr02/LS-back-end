import { Link } from "./schema.js";
import { getDB } from "./utils.js";

const genSummary = (link: string): Promise<string> => {
  return fetch(`https://r.jina.ai/${link}`, {
    method: "GET",
  }).then(res => res.text())
}

export const newBookmark = (opts: {
  uid: number,
  link: string,
  label: string,
  summary: string,
  tags: string,
  fav: boolean,
}): Promise<string[]> => {

  const db = getDB();
  const arr: any[] = Array.from(Object.values(opts))

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        'INSERT INTO bookmarks VALUES (?,?,?,?,?,?)', arr
      )
      db.close()
      return;
    })
  })
}

export const filterBookmark = (
  query: { [x: string]: string }) => {

  const db = getDB();
  return new Promise((resolve, reject) => {
    let sqlQuery = `${Object.keys(query)[0]} LIKE '%${Object.values(query)[0]}%'`
    db.serialize(() => {
      db.all(`SELECT * FROM links WHERE ${sqlQuery}`,
        (err: Error, rows: Link[]) => {
          db.close()
          if (err) reject(err)
          else resolve(rows)
          return;
        })
    })
  })
}


export const updateBookmarkField = (
  query: { [x: string]: string | number | boolean },
  updated: { [x: string]: string | number | boolean }
) => {

  const db = getDB();
  return new Promise((resolve, reject) => {
    let sqlQuery = `${Object.keys(query)[0]} LIKE '%${Object.values(query)[0]}%'`
    let sqlUpdate = Array.from(
      Object.keys(updated).map(
        k => `${k}=${updated[k]}`
      )).join(',')

    db.serialize(() => {
      db.run(
        `UPDATE bookmarks SET ${sqlUpdate} WHERE ${sqlQuery}`,
        (err) => {
          db.close()
          if (err) reject(err)
          else resolve(undefined)
        }
      )
    })
  })
}
