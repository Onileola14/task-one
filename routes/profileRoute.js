const express = require("express");
const { createProfile } = require("../controllers/profile");
const router = express.Router();

router.route("/").post(createProfile);

module.exports = router
