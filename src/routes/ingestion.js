import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import parsePDF from "../services/PdfParsing.js";

const router = express.Router();

// multer memory =storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/test", (req, res) => {
  console.log("POST /test hit");
  res.json({ message: "POST test working" });
});

router.post("/ingest", upload.single("file"), async (req, res) => {
  // console.log("Headers:", req.headers);
  // console.log("File:", req.file);

  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded",
    });
  }

  try {
    const uploadDir = path.join(process.cwd(), "uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const tempPath = path.join(
      uploadDir,
      `${Date.now()}-${req.file.originalname}`,
    );

    fs.writeFileSync(tempPath, req.file.buffer);

    const result = await parsePDF(tempPath);

    res.status(200).json({
      message: "PDF ingested successfully",
      file: req.file.originalname,
      parsed: result,
    });
  } catch (error) {
    console.error("Ingestion error:", error);
    res.status(500).json({
      error: "Ingestion failed",
      message: error.message,
    });
  }
});

export default router;
