const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectDB = require("./config/db");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const colors = require("colors");
const errorHandler = require("./middleware/error");
const path = require("path");

dotenv.config({ path: "./config/config.env" });

connectDB();

const auth = require("./routes/auth");
const entries = require("./routes/entries");

const app = express();

app.use(express.json());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100
});
app.use(limiter);
app.use(cors());

app.use("/api/v1/auth", auth);
app.use("/api/v1/entries", entries);

app.use(express.static("client/public"));
app.use(express.static("client/public/docs"));

app.get("/docs", (req, res) =>
  res.sendFile(path.resolve(__dirname, "client", "public", "docs", "docs.html"))
);

app.get("*", (req, res) =>
  res.sendFile(path.resolve(__dirname, "client", "public", "index.html"))
);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  server.close(() => process.exit(1));
});
