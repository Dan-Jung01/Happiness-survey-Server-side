var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");

/* Authorization check */
const authorize = (req, res, next) => {
  const authorization = req.headers.authorization;
  let token = null;

  // Retrieve token
  if (authorization && authorization.split(" ").length == 2) {
    token = authorization.split(" ")[1];
  } else if (authorization && authorization.split(" ")[1] !== "Bearer") {
    res.status(401).json({
      error: true,
      message: "Authorization header is malformed",
    });
    return;
  } else {
    res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
    return;
  }

  // Verify JWT and check expiration date
  try {
    secretKey = process.env.SECRETKEY;
    const decoded = jwt.verify(token, secretKey);

    if (decoded.exp < Date.now()) {
      res.status(401).json({
        error: true,
        message: "JWT token has expired",
      });
      return;
    }
    // Permit user to advance to route
    next();
  } catch (e) {
    if (
      authorization.split(" ")[1] == "" ||
      authorization.split(" ")[0] !== "Bearer"
    ) {
      res.status(401).json({
        error: true,
        message: "Authorization header is malformed",
      });
      return;
    } else {
      res.status(401).json({
        error: true,
        message: "Invalid JWT token",
      });
    }
  }
};

/* GET /factors */
router.get("/factors/:year", authorize, function (req, res, next) {
  const year = req.params.year;
  const limit = req.query.limit;
  const country = req.query.country;

  const { queryLimit, queryCountry, ...remainingQuery } = req.query;
  const paramsOfInvalidKeys = Object.keys(remainingQuery).length;

  if (paramsOfInvalidKeys > 1) {
    res.status(400).json({
      error: true,
      message:
        "Invalid query parameters. Only limit and country are permitted.",
    });
  }

  if (year && country) {
    req.db
      .from("happiness.rankings")
      .select(
        `rank`,
        `country`,
        `score`,
        `economy`,
        `family`,
        `health`,
        `freedom`,
        `generosity`,
        `trust`
      )
      .where(`year`, "like", `%${year}%`)
      .where(`country`, "like", `%${country}%`)
      .then((result) => {
        if (!country.match(/^[A-Z ]+$/i)) {
          res.status(400).json({
            error: true,
            message:
              "Invalid country format. Country query parameter cannot contain numbers.",
          });
        } else if (!year.match(/^\d{4}$/)) {
          res.status(400).json({
            error: true,
            message: "Invalid year format. Format must be yyyy.",
          });
        } else {
          res.json(result);
        }
      })
      .catch((err) => {
        res.status(400).json({
          error: true,
          message:
            "Invalid country format. Country query parameter cannot contain numbers.",
        });
      });
  } else if (year && limit) {
    req.db
      .from("happiness.rankings")
      .select(
        `rank`,
        `country`,
        `score`,
        `economy`,
        `family`,
        `health`,
        `freedom`,
        `generosity`,
        `trust`
      )
      .where(`year`, "like", `%${year}%`)
      .limit(limit)
      .then((result) => {
        if (!year.match(/^\d{4}$/)) {
          res.status(400).json({
            error: true,
            message: "Invalid year format. Format must be yyyy.",
          });
        } else if (!limit.match(/^[1-9][0-9]*$/)) {
          res.status(400).json({
            error: true,
            message: "Invalid limit query. Limit must be a positive number!!.",
          });
        } else {
          res.json(result);
        }
      })
      .catch((err) => {
        res.status(400).json({
          error: true,
          message: "Invalid limit query. Limit must be a positive number.",
        });
      });
  } else if (year) {
    req.db
      .from("happiness.rankings")
      .select(
        `rank`,
        `country`,
        `score`,
        `economy`,
        `family`,
        `health`,
        `freedom`,
        `generosity`,
        `trust`
      )
      .where(`year`, "like", `%${year}%`)
      .then((result) => {
        if (year.match(/^\d{4}$/)) {
          res.json(result);
        } else {
          res.status(400).json({
            error: true,
            message: "Invalid year format. Format must be yyyy.",
          });
        }
      })
      .catch((err) => {
        res.status(400).json({
          error: true,
          message:
            "Invalid country format. Country query parameter cannot contain numbers.",
        });
      });
  }
});

module.exports = router;
