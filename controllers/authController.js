const axios = require("axios");
const User = require("../models/User");
const { v7: uuidv7 } = require("uuid");
const RefreshToken = require("../models/RefreshToken");
const { getRefreshTokenExpiry } = require("../utils/tokens");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/tokens");

// 🔹 Redirect to GitHub
const githubAuth = (req, res) => {
  const { state, code_challenge } = req.query;

  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}&scope=user:email&state=${state}&code_challenge=${code_challenge}&code_challenge_method=S256`;

  res.redirect(url);
};

// 🔹 Callback
const githubCallback = async (req, res) => {
  const { code, code_verifier } = req.query;

  try {
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        code_verifier,
      },
      {
        headers: { Accept: "application/json" },
      },
    );

    const githubToken = tokenRes.data.access_token;

    const userRes = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubToken}`,
      },
    });

    const githubUser = userRes.data;

    let user = await User.findOne({ github_id: githubUser.id });

    if (!user) {
      user = await User.create({
        id: uuidv7(),
        github_id: githubUser.id,
        username: githubUser.login,
        avatar_url: githubUser.avatar_url,
        created_at: new Date(),
      });
    }

    user.last_login_at = new Date();
    await user.save();

    const access_token = generateAccessToken(user);
    const refresh_token = generateRefreshToken();

    await RefreshToken.create({
      token: refresh_token,
      user_id: user.id,
      expires_at: getRefreshTokenExpiry(),
    });
    // TODO: Save refresh_token in DB (next step)

    res.json({
      status: "success",
      access_token,
      refresh_token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Authentication failed",
    });
  }
};

// 🔹 Refresh Token
const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      status: "error",
      message: "Refresh token required",
    });
  }

  const existingToken = await RefreshToken.findOne({
    token: refresh_token,
  });

  if (!existingToken) {
    return res.status(401).json({
      status: "error",
      message: "Invalid refresh token",
    });
  }

  // 🔥 Check expiry
  if (existingToken.expires_at < new Date()) {
    await RefreshToken.deleteOne({ token: refresh_token });

    return res.status(401).json({
      status: "error",
      message: "Refresh token expired",
    });
  }

  // 🔥 Get user
  const user = await User.findOne({ id: existingToken.user_id });

  if (!user || !user.is_active) {
    return res.status(403).json({
      status: "error",
      message: "User inactive",
    });
  }

  // 🔥 DELETE OLD TOKEN (rotation)
  await RefreshToken.deleteOne({ token: refresh_token });

  // 🔥 ISSUE NEW TOKENS
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken();

  await RefreshToken.create({
    token: newRefreshToken,
    user_id: user.id,
    expires_at: getRefreshTokenExpiry(),
  });

  res.json({
    status: "success",
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
  });

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.redirect("http://localhost:3000/dashboard");
};

// 🔹 Logout
const logout = async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      status: "error",
      message: "Refresh token required",
    });
  }

  await RefreshToken.deleteOne({ token: refresh_token });

  res.json({
    status: "success",
    message: "Logged out",
  });
};

module.exports = {
  githubAuth,
  githubCallback,
  refreshToken,
  logout,
};
