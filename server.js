const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

//import middleware
const morgan = require("morgan");
const colors = require("colors");
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");

//load env vars
dotenv.config({ path: "./config/config.env" });

//route files
const auth = require("./routes/auth");
const users = require("./routes/users");
const posts = require("./routes/posts");
const matches = require("./routes/matches");
const line = require("./routes/line");

//connect to DB
connectDB();

//init
const app = express();

// mount line here in order not to use the following parsers
app.use("/api/v1/line", line);

//add intergrated body parser
app.use(express.json());

//cookie parser
app.use(cookieParser());

//set morgan
if (process.env.NODE_ENV === `development`) {
  app.use(morgan("dev"));
}

//file uploading
app.use(fileupload());

//sanitize data
app.use(mongoSanitize());

//set security headers
app.use(helmet());

//prevent xss script attacks
app.use(xss());

//rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, //10 mins
  max: 100, //100
});
app.use(limiter);

//prevent http param pollution
app.use(hpp());

//enable cors
app.use(cors());

//set static folder
app.use(express.static(path.join(__dirname, "public")));

//mount routers
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/posts", posts);
app.use("/api/v1/matches", matches);

//needs to be placed after mounting
app.use(errorHandler);

//set port
const PORT = process.env.PORT || 5000;

//server initialization
const server = app.listen(
  PORT,
  console.log(
    `伺服器模式${process.env.NODE_ENV}，在 PORT ${PORT} 啟動`.cyan.bold
  )
);

// unhandled rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`未處理錯誤：${err.message}`.yellow);
  server.close(() => process.exit(1));
});
