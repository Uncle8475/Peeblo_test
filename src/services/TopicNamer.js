import { GoogleGenerativeAI } from "@google/generative-ai";

const generateTopic = async (sampleText) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `Generate a concise academic topic title (max 5 words) summarizing the following text:\n${sampleText}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // console.log("Generated topic_name:", text);
    return text;
  } catch (error) {
    console.error("Google AI error:", error);
    throw error; 
  }
};

export default generateTopic;
