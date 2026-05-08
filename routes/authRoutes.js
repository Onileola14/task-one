const express = require("express");
const {
  githubAuth,
  githubCallback,
  refreshToken,
  logout,
} = require("../controllers/authController");

const router = express.Router();

router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

module.exports = router;