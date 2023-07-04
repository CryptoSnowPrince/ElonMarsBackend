import express from "express";
import https from "https";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import cors from "cors";
import bodyParser from 'body-parser';
import colors from 'colors';
import cookieParser from 'cookie-parser';
import serveStatic from 'serve-static';
import rateLimit from "express-rate-limit"

import uuid from 'node-uuid';
import _ from 'lodash';
import socketConnectionManager from "./socket.js";
import { connectMongoDB } from "./db/connecton.js";

import dotenv from "dotenv";
dotenv.config();

//port declaration................................

const PORT = process.env.PORT || 5000;
const base_url = process.env.BASE_URL

//database connection..............................
connectMongoDB();


//Importing the routes ............................
import usersRouter from './routes/usersRoutes.js';
import pvpRouter from './routes/pvpRoutes.js';
import { getTokenPrice } from "./helper/tokenPriceHelper.js";
import { TOKEN_CONTRACT_ADDRESS } from "./utiles/constants.js";

//middleware function calling .....................
const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());

// set up rate limiter
const limiter = rateLimit({
  windowMs: 1 * 60 * 60 * 1000, // 15 minutes
  max: 300 // limit each IP to 100 requests per windowMs
});

// apply rate limiter to all requests
app.use(limiter);

const __dirname = path.resolve();
app.use(serveStatic(path.join(__dirname, 'public')));

// routes declarations ............................
app.use(`${base_url}user`, usersRouter);
app.use(`${base_url}pvp`, pvpRouter);

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`app is listening on port ${PORT}`);
});

const requestCountByClientId = {};

// SOCKET SERVER
const io = new Server(server);

io.use((socket, next) => {
  const clientId = socket.id;
  const now = Date.now();
  const lastRequestTime = requestCountByClientId[clientId] || 0;

  if (lastRequestTime + 1000 < now) {
    // reset request count if last request was more than 60 seconds ago
    requestCountByClientId[clientId] = 1;
  } else if (requestCountByClientId[clientId] >= 20) {
    // enforce rate limit of 10 requests per minute
    socket.emit('error', 'Rate limit exceeded');
    return;
  } else {
    requestCountByClientId[clientId]++;
  }
  next(); // allow request to proceed
});

io.on("connection", function (socket) {
  socketConnectionManager(socket, io);
});

export default app;

