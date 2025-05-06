//// so here's what I am gonna do
//// we'll use postgres for auth
//
// users
// | uid | name | email | phash | sessionKey | tte |
//
// links
// | uid | link | label | summary | id | tags | fav |


import { env, argv, loadEnvFile } from "process";
import { exec } from 'child_process';
import { getDB } from './utils.js';

const createSchema = () => {
  // getDB().then((x) => {
  const x = getDB();
  x.serialize(() => {
    x.run(`CREATE TABLE IF NOT EXISTS bookmarks (
    bid INTEGER PRIMARY KEY,
    uid INTEGER,
    link TEXT,
    label VARCHAR(100),
    summary TEXT,
    tags TEXT,
    fav INTEGER,
    FOREIGN KEY (uid) REFERENCES users(uid))`)

    x.run(`CREATE TABLE users (
    uid INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    phash TEXT,
    sessionKey TEXT,
    sco INTEGER,
    tte INTEGER)`)

    x.run('PRAGMA foreign_keys = ON')
    x.close()
  })

}

export interface Link {
  uid: string
  link: string
  label: string
  summary: string
  tags: string
  fav: boolean
}

export interface User {
  uid: string
  name: string
  email: string
  phash: string
  sessionKey: string
  sco: number
  tte: number
}


loadEnvFile('.env')
console.log(argv[2])
if (argv[2] === 'createSchema') {
  await createSchema();
}
else if (argv[2] === 'createDB') {
  exec(`sqlite ${env.DBLOC}`)
}
else if (argv[2] === 'dropDB') {
  exec(`rm ${env.DBLOC}`)
}
