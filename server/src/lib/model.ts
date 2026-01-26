import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";

export const groq = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-120b",
    streaming: true,
});


export const llm = new ChatOpenAI({
    model: 'anthropic/claude-haiku-4.5',
    configuration: {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: process.env.OPENROUTER_BASE_URL,
    }
});

export const model = new ChatOpenAI({
    model: 'anthropic/claude-haiku-4.5',
    configuration: {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: process.env.OPENROUTER_BASE_URL,
    }
});
