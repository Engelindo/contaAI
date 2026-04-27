import express from "express";
import { env } from "./config/env.js";
import webhookRoute from "./routes/webhook.js";

const app = express();

app.use(express.json());

app.get("/", (_, res) => {
  res.send("Finance AI Bot running 🚀");
});

app.use("/webhook", webhookRoute);

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});