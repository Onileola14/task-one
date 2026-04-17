// require("dotenv").config();
// require("express-async-error");
// const connectDB = require("./db/connectDB");
// const errorHandlerMiddleware = require("./middlewares/errorHandlerMiddleware");
// const notFoundError = require("./middlewares/not-found-error");
// const profileRoute = require("./routes/profileRoute");
// const cors = require("cors");
// const express = require("express");

// const app = express();
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// app.use("/api/profiles", profileRoute);

// app.use(errorHandlerMiddleware);
// app.use(notFoundError);

// const port = 5000;
// const start = async () => {
//   try {
//     await connectDB(process.env.MONGO_URI);
//     app.listen(port, () => console.log(`server listening on port ${port}....`));
//   } catch (error) {
//     console.log(error);
//   }
// };

// start();


require("dotenv").config();
require("express-async-error");

const connectDB = require("./db/connectDB");
const errorHandlerMiddleware = require("./middlewares/errorHandlerMiddleware");
const notFoundError = require("./middlewares/not-found-error");
const profileRoute = require("./routes/profileRoute");

const cors = require("cors");
const express = require("express");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/profiles", profileRoute);

app.use(errorHandlerMiddleware);
app.use(notFoundError);

// 👇 IMPORTANT: export app instead of listening
module.exports = async (req, res) => {
  await connectDB(process.env.MONGO_URI);
  return app(req, res);
};