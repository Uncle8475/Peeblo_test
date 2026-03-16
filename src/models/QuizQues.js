import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: String,

  type: {
    type: String,
    enum: ["MCQ", "True/False", "Fill in the blank"],
  },

  options: [String],

  answer: String,

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
  },
  chunkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chunk",
  },
});

export default mongoose.model("QuizQuestions", questionSchema);
