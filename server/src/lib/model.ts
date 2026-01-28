import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";

export const groq = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-120b",
    streaming: true,
});

//'openai/gpt-5-pro',
//openai/gpt-5.2-codex

export const llm = new ChatOpenAI({
    model: 'openai/gpt-5.2',
    configuration: {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: process.env.OPENROUTER_BASE_URL,
    }
});

export const model = new ChatOpenAI({
    model: 'openai/gpt-5.2',
    configuration: {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: process.env.OPENROUTER_BASE_URL,
    }
});
