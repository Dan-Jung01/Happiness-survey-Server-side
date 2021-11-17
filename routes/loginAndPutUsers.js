var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
let loginEmail;

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

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

/* POST user login */
router.post("/login", function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;
  loginEmail = email;

  //Verify body
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required",
    });
    return;
  }
  const queryUsers = req.db
    .from("users")
    .select("*")
    .where("email", "=", email);
  queryUsers
    .then((users) => {
      if (users.length == 0) {
        res.status(401).json({
          error: true,
          message: "Incorrect email or password",
        });
        return;
      }
      // Compare password hashes
      const user = users[0];
      return bcrypt.compare(password, user.hash);
    })
    .then((match) => {
      if (!match) {
        res.status(401).json({
          error: true,
          message: "Incorrect email or password",
        });
        return;
      }
      // Create and return JWT token
      const secretKey = process.env.SECRETKEY;
      const expires_in = 60 * 60 * 24; // 1DAY
      const exp = Date.now() + expires_in * 1000;
      const token = jwt.sign({ email, exp }, secretKey);
      res.status(200).json({ token, token_type: "Bearer", expires_in });
    });
});

/* PUT /user/{email}/profile */
router.put("/:email/profile", authorize, function (req, res, next) {
  const email = req.params.email;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const dob = req.body.dob;
  const address = req.body.address;

  if (email != loginEmail) {
    res.status(403).json({
      error: true,
      message: "Forbidden",
    });
    return;
  }

  const profile = {
    email,
    firstName,
    lastName,
    dob,
    address,
  };

  let today = new Date();
  let dd = String(today.getDate()).padStart(2, "0");
  let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  let yyyy = today.getFullYear();
  today = yyyy + "-" + mm + "-" + dd;

  // Vertify body
  if (!firstName || !lastName || !dob || !address) {
    res.status(400).json({
      error: true,
      message:
        "Request body incomplete: firstName, lastName, dob and address are required.",
    });
    return;
  }

  // Check DoB Format
  if (!dob.match(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/)) {
    res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
    });
    return;
  }

  let d = new Date(dob);
  let ddd = String(d.getDate()).padStart(2, "0");
  let m = String(d.getMonth() + 1).padStart(2, "0"); //January is 0!
  let y = d.getFullYear();
  dobDate = y + "-" + m + "-" + ddd;

  if (dob !== dobDate) {
    res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
    });
    return;
  }

  // Check DoB is in the past
  if (dob.valueOf() > today.valueOf()) {
    res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a date in the past.",
    });
    return;
  }

  if (!/^[a-zA-Z ]*$/.test(firstName) || typeof firstName !== "string") {
    res.status(400).json({
      error: true,
      message:
        "Request body invalid, firstName, lastName and address must be strings only.",
    });
    return;
  }

  if (!/^[a-zA-Z ]*$/.test(lastName) || typeof lastName !== "string") {
    res.status(400).json({
      error: true,
      message:
        "Request body invalid, firstName, lastName and address must be strings only.",
    });
    return;
  }

  if (!/^[a-zA-Z0-9\s,'-]*$/.test(address) || typeof address !== "string") {
    res.status(400).json({
      error: true,
      message:
        "Request body invalid, firstName, lastName and address must be strings only.",
    });
    return;
  }

  req.db
    .from("users")
    .where("email", "=", email)
    .update(profile)
    .then(() => {
      res.json(profile);
    })
    .catch((error) => {
      res.status(500).json({ message: "Database error - not updated" });
    });
});

module.exports = router;
