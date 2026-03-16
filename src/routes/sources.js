import express from "express";
import path from "path";
import Chunk from "../models/TextChunks.js";
import Question from "../models/QuizQues.js";

const router = express.Router();

// LOADS ALL PDF UPLOAED BY THE USER AND SHOWS IN FRONTEND TO SELECT
router.get("/sources", async (req, res) => {
  try {
    // taking information of all pdfs uploaded
    const grouped = await Chunk.aggregate([
      {
        $group: {
          _id: "$source",
          topic: { $first: "$topic" },
          docId: { $first: "$_id" },
        },
      },
    ]);
    // from here user can select which pdf quiz he wants to select
    const sources = grouped.map((g) => ({
      _id: g.docId,
      filename: path.basename(g._id || ""),
      topic: g.topic,
    }));

    res.json({
      total: sources.length,
      sources,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// AFTER SLECTING PDF , QUEESTINO WILL BE LOADED
router.get("/source/quiz", async (req, res) => {
  try {
    const { sourceId, difficulty } = req.query;

    if (!sourceId) {
      return res.status(400).json({
        error: "sourceId is required",
      });
    }

    // Find the chunk  sourceId
    const selectedChunk = await Chunk.findById(sourceId);
    if (!selectedChunk) {
      return res.status(404).json({
        error: "Source not found",
      });
    }

    const sourcePath = selectedChunk.source;

    // Find all chunks for source
    const relatedChunks = await Chunk.find({ source: sourcePath });
    const chunkIds = relatedChunks.map((c) => c._id);

    const questionQuery = { chunkId: { $in: chunkIds } };

    if (difficulty) {
      questionQuery.difficulty = difficulty;
    }

    //   removing answeeer from the json shhared withh browseer frontend
    let questions = await Question.aggregate([
      { $match: questionQuery },
      { $sample: { size: 3 } },
      {
        $project: {
          answer: 0,
          __v: 0,
          chunkId: 0,
        },
      },
    ]);

    //   json format info for user to attemt quiz
    res.json({
      sourceId,
      sourceFilename: path.basename(sourcePath),
      difficulty: difficulty || "all",
      totalQuestions: questions.length,
      questions,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

router.post("/source/quiz/submit-answer", async (req, res) => {
  try {
    // "student_id": "S001", // "question_id": "Q12", // "selected_answer": "3"

    const {
      student_id,
      question_id,
      selected_answer,
      sourceId,
      currentDifficulty,
      more,
    } = req.body;

    if (!student_id) {
      return res.status(400).json({
        error: "student_id missing in request",
      });
    }

    if (!Array.isArray(question_id) || !Array.isArray(selected_answer)) {
      return res.status(400).json({
        error: "question_id and selected_answer missing",
      });
    }

    if (question_id.length !== selected_answer.length) {
      return res.status(400).json({
        error: "question_id length != selected_answer length ",
      });
    }

    let results = [];
    let score = 0;

    for (let i = 0; i < question_id.length; i++) {
      const qid = question_id[i];
      const ans = selected_answer[i];

      // tracking queeesation
      const question = await Question.findById(qid).lean();

      if (!question) {
        results.push({
          question_id: qid,
          error: "Question not found",
        });
        continue;
      }

      // tracking queeesation
      const isCorrect = String(question.answer).trim() === String(ans).trim();

      if (isCorrect) score++;

      results.push({
        question_id: qid,
        selected_answer: ans,
        correct: isCorrect,
        correct_answer: isCorrect ? null : question.answer,
      });
    }

    const total = question_id.length;
    const percentage = (score / total) * 100;

    let response = {
      student_id: student_id || null,
      total_questions: total,
      correct_answers: score,
      score_percentage: percentage,
      results,
    };

    // result score
    if ( sourceId && currentDifficulty) {
      const levels = ["easy", "medium", "hard"];
      let index = levels.indexOf(currentDifficulty);
      let nextDifficulty = currentDifficulty;

      if (percentage === 100 && index < levels.length - 1) {
        nextDifficulty = levels[index + 1];
      } else if (percentage < 50 && index > 0) {
        nextDifficulty = levels[index - 1];
      }

      const selectedChunk = await Chunk.findById(sourceId);
      const sourcePath = selectedChunk.source;

      const relatedChunks = await Chunk.find({ source: sourcePath });
      const chunkIds = relatedChunks.map((c) => c._id);

      const questions = await Question.aggregate([
        { $match: { chunkId: { $in: chunkIds }, difficulty: nextDifficulty } },
        { $sample: { size: 3 } },
        {
          $project: {
            answer: 0,
            __v: 0,
            chunkId: 0,
          },
        },
      ]);

      response.nextDifficulty = nextDifficulty;
      response.nextQuiz = questions;
    }

    res.json(response);
    res.redirect(
  `/peblo/api/source/quiz?sourceId=${sourceId}&difficulty=${nextDifficulty}`
);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
