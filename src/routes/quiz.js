import express from "express";
import mongoose from "mongoose";
import Chunk from "../models/TextChunks.js";
import Question from "../models/QuizQues.js";
import generateQuiz from "../services/quizGen.js";

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    const { sourceId,sourceID,source_id,source} = req.body || {};
    const sourceIDval = sourceId || sourceID || source_id || source;

    if (!sourceIDval) {
      return res.status(400).json({
        error:"No sourceId found in body  ",
      });
    }

    const query = mongoose.isValidObjectId(sourceIDval)
      ? { _id: sourceIDval }
      : { source: sourceIDval };

    const chunks = await Chunk.find(query).limit(5);

    if (!chunks.length) {
    //   console.log("no chunk of this srcID", query, "srcID from body:", req.body);
      return res.status(404).json({
        error: "No chunks hhere",
      });
    }

    let createdQuestions = [];
//    loading question 
    for (const chunk of chunks) {
      let quiz = null;
      try {
        quiz = await generateQuiz(chunk.text);
      } catch(e){
        console.error("Error generating quiz for chunk", chunk._id, e);
      }
      if (!quiz||!quiz.questions|| !quiz.questions.length) {
        // console.log(quiz.questions);
        console.log("No questions generated (empty)", chunk._id);
        if (quiz?.parseError) console.log("Parse error:", quiz.parseError);
        if (quiz?.error) console.log("LLM error:", quiz.error);
        continue;
      }

      ////////////////
      for (const q of quiz.questions) {
        const question = new Question({
          question: q.question,
          type: q.type,
          options: q.options || [],
          answer: q.answer,
          difficulty: q.difficulty || "easy",
          chunkId: chunk._id,
        });

        await question.save();
        createdQuestions.push(question);
      }
    }

    res.status(200).json({
      message: "Quiz generated successfully",
      totalChunksUsed: chunks.length,
      questionsCreated: createdQuestions.length,
      questions: createdQuestions,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);

    res.status(500).json({
      error: "Quiz generation failed",
      message: error.message,
    });
  }
});

export default router;

//impm notee  
// need to inlcude it and also solve error od srcID not found in body and also if no chunk found for that srcID