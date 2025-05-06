import { Link } from "./schema.js";
import { getDB } from "./utils.js";

export const genSummary = (link: string): Promise<string> => {
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
  fav: 0 | 1,
}): Promise<null> => {

  const db = getDB();
  const { uid, link, label, summary, tags, fav } = opts;

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `INSERT INTO bookmarks (
        uid, link, label, summary, tags, fav
      ) VALUES (?,?,?,?,?,?)`,
        [uid, link, label, summary, tags, fav]
      )
      db.close()
      resolve(null)
    })
  })
}

export const userBookmarks = (uid: number): Promise<Link[]> => {
  const db = getDB();
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(`SELECT * FROM bookmarks WHERE uid=?`[uid],
        (err: Error, rows: Link[]) => {
          db.close()
          if (err) reject(err)
          else resolve(rows)
          return;
        })
    })
  })
}
export const filterBookmark = (
  query: { [x: string]: string }): Promise<Link[]> => {

  const db = getDB();
  return new Promise((resolve, reject) => {
    let sqlQuery = `${Object.keys(query)[0]} LIKE '%${Object.values(query)[0]}%'`
    db.serialize(() => {
      db.all(`SELECT * FROM bookmarks WHERE ${sqlQuery}`,
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
): Promise<null> => {

  const db = getDB();
  return new Promise((resolve, reject) => {
    const sqlQueryVals: any[] = [], sqlUpdateVals: any[] = [];
    const sqlQuery = [...Object.keys(query).map(k => {
      sqlQueryVals.push(query[k])
      return `${k} LIKE ?`
    })].join(' AND ')
    const sqlUpdate = [...Object.keys(updated).map(k => {
      sqlUpdateVals.push(updated[k]);
      return `${k}=?`
    })].join(' , ')

    db.serialize(() => {
      db.run(
        `UPDATE bookmarks SET ${sqlUpdate} WHERE ${sqlQuery}`,
        [...sqlUpdateVals, ...sqlQueryVals],
        (err) => {
        console.log([sqlUpdate, sqlQuery])
        console.log([...sqlUpdateVals, ...sqlQueryVals])

          db.close()
          if (err) reject(err)
          else resolve(null)
        }
      )
    })
  })
}

export const deleteBookmark = (id: number): Promise<null> => {
  const db = getDB();
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('DELETE FROM bookmarks WHERE bid=?', [id],
        (err) => {
          if (err) reject()
          else resolve(null)
        })
    })
  })
}
