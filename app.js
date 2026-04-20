require("dotenv").config();
require("express-async-error");
const connectDB = require("./db/connectDB");
const errorHandlerMiddleware = require("./middlewares/errorHandlerMiddleware");
const notFoundError = require("./middlewares/not-found-error");
const profileRoute = require("./routes/profileRoute");
const cors = require("cors");
const express = require("express");

const app = express();
// ========================
app.get('/', (req, res) => {
    
  res.send(`A backend service that accepts a name, aggregates data from external APIs (**Genderize, Agify, Nationalize**), processes the result, and stores it in a database with proper validation, idempotency, and error handling.
`);
});
//=======================

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/profiles", profileRoute);

app.use(errorHandlerMiddleware);
app.use(notFoundError);

const port = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI);
app.listen(port, () => console.log(`server listening on port ${port}....`));
