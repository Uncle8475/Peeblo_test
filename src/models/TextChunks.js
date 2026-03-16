import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
    },
    source: {
      type: String,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Chunk", chunkSchema);
