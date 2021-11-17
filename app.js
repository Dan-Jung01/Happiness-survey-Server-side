var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
const helmet = require("helmet");
const cors = require("cors");
yaml = require("yamljs");
const swaggerUI = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger.json");

var factorsRouter = require("./routes/factors");
var rankingsRouter = require("./routes/rankings");
var countriesRouter = require("./routes/countries");
var loginAndPutUsersRouter = require("./routes/loginAndPutUsers");
var getUserRouter = require("./routes/getUser");
var registerRouter = require("./routes/register");

var app = express();

const options = require("./knexfile.js");
const knex = require("knex")(options);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("common"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(helmet());
app.use(cors());

app.use((req, res, next) => {
  req.db = knex;
  next();
});

app.use("/", factorsRouter);
app.use("/", rankingsRouter);
app.use("/", countriesRouter);
app.use("/user", loginAndPutUsersRouter);
app.use("/user", getUserRouter);
app.use("/user", registerRouter);
app.use("/", swaggerUI.serve);
app.get("/", swaggerUI.setup(swaggerDocument));
app.get("/knex", function (req, res, next) {
  req.db
    .raw("SELECT VERSION()")
    .then((version) => console.log(version[0][0]))
    .catch((err) => {
      console.log(err);
      throw err;
    });
  res.send("Version Logged successfully");
});

logger.token("req", (req, res) => JSON.stringify(req.headers));
logger.token("res", (req, res) => {
  const headers = {};
  res.getHeaderNames().map((h) => (headers[h] = res.getHeader(h)));
  return JSON.stringify(headers);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
