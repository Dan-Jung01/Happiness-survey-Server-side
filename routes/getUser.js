var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* Authorization check for profile */
const profileAuthorize = (req, res, next) => {
  const authorization = req.headers.authorization;
  let token = null;
  const email = req.params.email;

  const queryPrivateUsers = req.db
    .from("users")
    .select("email", "firstName", "lastName", "dob", "address")
    .where("email", "=", email);

  const queryPublicUsers = req.db
    .from("users")
    .select("email", "firstName", "lastName")
    .where("email", "=", email);

  // Retrieve token
  if (authorization && authorization.split(" ").length == 2) {
    token = authorization.split(" ")[1];

    const decode = jwt.verify(token, process.env.SECRETKEY);

    if (email == decode.email) {
      queryPrivateUsers.then((users) => {
        const allUser = Object.assign({}, ...users);
        if (users.length > 0) {
          res.json(allUser);
        } else {
          res.status(404).json({
            error: true,
            message: "User not found",
          });
        }
      });
    } else {
      queryPublicUsers.then((users) => {
        const allUser = Object.assign({}, ...users);
        if (users.length > 0) {
          res.json(allUser);
        } else {
          res.status(404).json({
            error: true,
            message: "User not found",
          });
        }
      });
    }
  } else {
    queryPublicUsers.then((users) => {
      const allUser = Object.assign({}, ...users);
      if (users.length > 0) {
        res.json(allUser);
      } else {
        res.status(404).json({
          error: true,
          message: "User not found",
        });
      }
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

/* GET /user/{email}/profile */
router.get("/:email/profile", profileAuthorize, function (req, res, next) {});

module.exports = router;
