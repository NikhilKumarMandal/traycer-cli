import { ChatGroq } from "@langchain/groq";

export const groq = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-120b",
    streaming: true,
});
