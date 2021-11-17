var express = require("express");
var router = express.Router();

/* GET /countries */
router.get("/countries", function (req, res, next) {
  req.db
    .from("happiness.rankings")
    .select("country")
    .groupBy("country")
    .orderBy("country")
    .then((rows) => {
      let row = rows.map((row) => row.country);
      const set = new Set(row);
      const country = [...set];
      res.json(row);
    })
    .catch((err) => {
      res.status(400).json({
        error: true,
        message:
          "Invalid query parameters. Query parameters are not permitted.",
      });
    });
});

module.exports = router;
