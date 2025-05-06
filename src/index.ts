import express from "express";
import { loadEnvFile, env } from "process";
import { addUser, initUserSession, validateSession, validateUser } from "./users.js";
loadEnvFile('.env')

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const allowedOrigins = ['http://localhost:5173']; // Add your Vite frontend URL
const corsOptions = {
  origin: (origin:string, callback:() => void) => {
    if (allowedOrigins.includes(origin) || !origin) { // Allow specific origins and no origin (e.g., mobile apps)
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Specify allowed HTTP methods
  credentials: true, // Enable sending cookies across origins if needed
  allowedHeaders: 'Content-Type, Authorization', // Specify allowed headers
};
app.use(cors(corsOptions));

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
userRouter.get('/initSession', (req, res) => {
  const { email, password } = req.body;
  validateUser(email, password).then(
    (x) => {
      if (x) initUserSession(email).then(
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
      });
      else res.status(400).send(JSON.stringify({
        error: true,
        message: "Invalid User"
      }))
    }
  )
})
userRouter.get('/keyCheck', (req, res) => {
  const { email, key } = req.body;
  DEBUG && console.debug("key Check", email, key)
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


app.use('/users', userRouter)

app.get('/', (req, res) => {
  res.send('Hello from the LS API')
})

app.listen(PORT, HOST, () => {
  DEBUG && console.debug("DEBUG MODE: ON")
  console.log(`local url: ${HOST}:${PORT}`)
})
