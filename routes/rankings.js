var express = require("express");
var router = express.Router();

/* GET /rankings */
router.get("/rankings", function (req, res, next) {
  const year = req.query.year;
  const country = req.query.country;

  const { queryYear, queryCountry, ...remaining } = req.query;
  const numberOfInvalidKeys = Object.keys(remaining).length;
  if (numberOfInvalidKeys > 2) {
    res.status(400).json({
      error: true,
      message: "Invalid query parameters. Only year and country are permitted.",
    });
  }

  if (year && country) {
    req.db
      .from("happiness.rankings")
      .select(`rank`, `country`, `score`, `year`)
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
        res.status(500).json({
          error: true,
          message: "Bad Request",
        });
      });
  } else if (year) {
    req.db
      .from("happiness.rankings")
      .select(`rank`, `country`, `score`, `year`)
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
            "Invalid country format. Country query parameter cannot contain numbers!.",
        });
      });
  } else if (country) {
    req.db
      .from("happiness.rankings")
      .select(`rank`, `country`, `score`, `year`)
      .where(`country`, "like", `%${country}%`)
      .orderBy("year", "desc")
      .then((result) => {
        if (country.match(/^[A-Z ]+$/i)) {
          res.json(result);
        } else {
          res.status(400).json({
            error: true,
            message:
              "Invalid country format. Country query parameter cannot contain numbers.",
          });
        }
      })
      .catch((err) => {
        res.status(400).json({
          error: true,
          message:
            "Invalid country format. Country query parameter cannot contain numbers!.",
        });
      });
  } else {
    req.db
      .from("happiness.rankings")
      .select(`rank`, `country`, `score`, `year`)
      .orderBy("year", "desc")
      .then((result) => {
        res.json(result);
      })
      .catch((err) => {
        res.status(400).json({
          error: true,
          message:
            "Invalid country format. Country query parameter cannot contain numbers!.",
        });
      });
  }
});

module.exports = router;
