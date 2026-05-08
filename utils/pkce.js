const crypto = require("crypto");

const base64URLEncode = (str) =>
  str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const sha256 = (buffer) =>
  crypto.createHash("sha256").update(buffer).digest();

const generatePKCE = () => {
  const code_verifier = base64URLEncode(crypto.randomBytes(32));
  const code_challenge = base64URLEncode(sha256(code_verifier));

  return { code_verifier, code_challenge };
};

module.exports = { generatePKCE };