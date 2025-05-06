import express, { Request, NextFunction, Response, RequestHandler } from "express";
import cors from "cors";
import { loadEnvFile, env } from "process";
import { addUser, getUser, initUserSession, validateSession, validateUser } from "./users.js";
import { deleteBookmark, filterBookmark, genSummary, newBookmark, updateBookmarkField } from "./links.js";
import { Link, User } from "./schema.js";
loadEnvFile('.env')

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const allowedOrigins = ['http://localhost:5173', 'http://localhost:8000']; // Add your Vite frontend URL
app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin!) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  allowedHeaders: 'Content-Type, Authorization',
}));

const [HOST, PORT] = [env.HOST!, parseInt(env.PORT!)]
const DEBUG = Boolean(env.DEBUG)

const userRouter = express.Router()

userRouter.get('/', (_req, res) => {
  res.send(JSON.stringify({
    message: "users api",
  }))
})
userRouter.post('/new', (req, res) => {
  const { name, email, password } = req.body;
  validateUser(email, null).then(
    (x) => {
      !x ? addUser(name, email, password).then(
        ([rName, rEmail]) => {
          res.status(201).send(JSON.stringify(
            {
              message: "User Created",
              name: rName,
              email: rEmail
            }
          ))
        }
      ).catch((err: Error) => {
        res.status(500).send(JSON.stringify({
          error: true,
          name: err.name,
          message: err.message
        }))
      }) : res.status(400).send({
        error: true,
        message: "User Exists",
      })
    }
  )
})
userRouter.post('/initSession', (req, res) => {
  const { email, password } = req.body;

  // checking if the user exists or not
  validateUser(email, null).then(
    (x) => {
      if (x) validateSession(email, password).then(
        () => {
          initUserSession(email).then(
            ([rEmail, key]) => {
              res.status(201).send(JSON.stringify({
                email: rEmail,
                key: key.toString()
              }))
            }
          ).catch((err: Error) => {
            res.status(500).send(JSON.stringify({
              error: true,
              name: err.name,
              message: err.message
            }))
          })
        })
      else res.status(400).send(JSON.stringify({
        error: true,
        message: "User Not Found"
      }))
    }
  )
})
userRouter.get('/keyCheck', (req, res) => {
  const { email, key } = req.body;
  validateSession(email, key).then(
    (x: Boolean) => {
      res.send({ active: x })
    }
  ).catch((err: Error) => {
    res.status(500).send(JSON.stringify({
      error: true,
      name: err.name,
      message: err.message
    }))
  })
})


const mainRouter = express.Router();

const checkKey = (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['key'] as string
  const email = req.headers['mail'] as string

  if (key && email) {
    validateSession(email, key).then(
      x => {
        if (x) {
          getUser(email).then(
            u => req.body.user = u
          ).finally(next)
        }
        else res.status(401).send(
          { error: 'Unauthorized: Missing or invalid validKey' }
        )
      }
    )
  }
}

mainRouter.use(checkKey);

mainRouter.post('/query', (req, res) => {
  const { query } = req.body;
  const user: User = req.body.user;
  if (!query)
    res.status(401).send({
      error: true,
      message: "Query request made but Query not found"
    })
  else filterBookmark(query).then(
    (results) => res.send({ results: results })
  ).catch((err: Error) => {
    res.status(500).send({
      error: true,
      message: err.message
    })
  })
})

mainRouter.post('/create', async (req, res) => {
  const bookmark: Partial<Link> = req.body.bookmark;
  const user: User = req.body.user;

  if (!bookmark)
    res.status(401).send({
      error: true,
      message: "No bookmarks in body found"
    })
  else {
    const summary = await genSummary(bookmark.link!);
    const completeBookmark: Link = {
      summary: summary,
      link: bookmark.link!,
      uid: user.uid,
      fav: bookmark.fav!,
      label: bookmark.label!,
      tags: bookmark.tags!,
    }
    newBookmark(completeBookmark).then(
      (_) => res.status(201).send({
        message: "Created new Bookmark"
      })
    ).catch((err: Error) => {
      res.status(500).send({
        error: true,
        message: err.message
      })
    })
  }
})

mainRouter.put('/update', (req, res) => {
  const query: { [x: string]: string | number | boolean } = req.body.query;
  const updatedFields: { [x: string]: string | number | boolean } = req.body.uf;
  const user: User = req.body.user;

  updateBookmarkField(
    { uid: user.uid, ...query }, updatedFields
  ).then(
    (_) => {
      res.status(201).send({
        message: "Updated",
        ...updatedFields
      })
    }
  ).catch((err: Error) => {
    res.status(500).send({
      error: true,
      message: err.message
    })
  })
})


mainRouter.delete('/delete', (req, res) => {
  const bid: number = req.body.bid;
  const user: User = req.body.user;
  deleteBookmark(bid).then(
    (_) => res.send({message: "Deleted"})
  )
})


app.use('/users', userRouter)
app.use('/main', mainRouter)

app.get('/', (req, res) => {
  res.send('Hello from the LS API')
})

app.listen(PORT, HOST, () => {
  DEBUG && console.debug("DEBUG MODE: ON")
  console.log(`local url: ${HOST}:${PORT}`)
})
