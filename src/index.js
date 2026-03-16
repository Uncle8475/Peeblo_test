import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./db.js";
import ingest from "./routes/ingestion.js";
import generateQuiz from "./routes/quiz.js";
import sources from "./routes/sources.js";

const app = express();

connectDB();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
// routes  
app.use("/peblo/api", ingest);
app.use("/peblo/api", generateQuiz);
app.use("/peblo/api", sources);
///////////////

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res
    .status(500)
    .json({ error: "Internal server error", message: err.message });
});

app.listen(PORT, () => {
  console.log("Server running on port:", PORT);
});
