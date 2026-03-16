import { GoogleGenerativeAI } from "@google/generative-ai";

const generateQuiz = async (chunkText) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    const prompt = `
Generate 9 quiz questions from the following educational text.

Include:
1 MCQ
1 True/False
1 Fill in the blank.

Return ONLY JSON in this format:

{
 "questions":[
   {
    "question":"",
    "type":"",
    "difficulty":"hard/medeium/easy"(add 3 question of each difficulty level),
    "options":[1,2,3,4] // only for MCQ [true,false for True/False and empty for Fill in the blank ],
    "answer":""
   }
 ]
}

Text:
${chunkText}
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text().trim();

    // remove non json wrapper (front and rare)
    text = text
      .replace(/^```(json\n)?/i, "")
      .replace(/```$/, "")
      .trim();
    if (text.startsWith("`")) {
      text = text.replace(/^`+/, "");
      text = text.replace(/`+$/, "");
      text = text.trim();
    }
    const jsonMatch = text.match(/\{[\s\S]*\}$/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
/////////////////
    try {
      const parsed = JSON.parse(text);
      return {
        questions: Array.isArray(parsed?.questions)?parsed.questions:[],
        raw: text,
      };
    } catch (parseError) {
      console.error("Json parsing problem:", parseError);
      // console.error("AI returned:", text);
      return {
        questions: [],
        raw: text,
        parseError: parseError.message,
      };
    }
  } catch (error) {
    console.error("LLM Problem :", error);
    return {
      questions: [],
      raw: null,
      error: error.message,
    };
  }
};

export default generateQuiz;
