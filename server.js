require("dotenv").config();
const express = require("express");
const timeout = require('connect-timeout')
const bp = require('body-parser')
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

const userRouter = require("./routes/users");
const authRouter = require("./routes/auth");
app.use(cors());
app.use(timeout('120s'))
app.use(bp.json({ limit: "25mb" }));
app.use(bp.urlencoded({ extended: true, limit: "25mb" }));

app.get("/", (_, res) => {res.json({ server: 'true' })});
app.use("/api/auth", authRouter,express.urlencoded({extended: true}));
app.use("/api/users", userRouter);

app.listen(port);
