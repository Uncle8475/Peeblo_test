import fs from "fs";
import { createRequire } from "module";
import Chunk from "../models/TextChunks.js";
import chunkText from "./Chunking.js";
import generateTopic from "./TopicNamer.js";

const require = createRequire(import.meta.url);
const PDF2Text = require("pdf2text");

const parsePDF = async (filePath) => {
  try {
    // console.log("Starting PDF parse for:", filePath);
    const buffer = fs.readFileSync(filePath);
    // console.log("Buffer length:", buffer.length);

   const text = await new Promise((resolve, reject) => {
  PDF2Text(buffer, (error, pages) => {
    if (error) {
      console.error("PDF2Text error:", error);
      reject(error);
    } else {
      let extractedText = pages.join(" ");

      // remove page no.
      extractedText = extractedText.replace(/Page\s*\d+/gi, "");

      // remove space ad newlines
      extractedText = extractedText.replace(/\s+/g, " ");

      // remove filename 
      const fileName = filePath.split("/").pop().replace(".pdf", "");
      const regex = new RegExp(fileName, "gi");
      extractedText = extractedText.replace(regex, "");

      extractedText = extractedText.trim();

      resolve(extractedText);
    }
  });
});

    const chunks = chunkText(text);
    console.log("Total no of chunks:", chunks.length);

    if (chunks.length === 0) {
      console.log("No chunks is there");
      return;
    }

    // by using llm for topic name
    const sampleText = chunks.slice(0, 2).join(" ");
    // console.log("Sample text:", sampleText);
    const topic_name = await generateTopic(sampleText);
    // console.log("Generated topic_name:", topic_name);
    ///////////////
    await Chunk.deleteMany({ source: filePath.split("/").pop() });

    const doc = chunks.map((chunk, i) => ({
      topic: topic_name,
      source: filePath.split("/").pop(),
      chunkIndex: i,
      text: chunk,
    }));
    await Chunk.insertMany(doc);

    console.log("Chunks stored in database");
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw error;
  }
};
export default parsePDF;
