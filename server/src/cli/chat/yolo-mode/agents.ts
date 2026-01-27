
import { groq, llm } from "../../../lib/model";
import { PHASE_GENERATION_AGENT_PROMPT, YOLO_PLANNED_AGENT_PROMPT } from "../../../lib/prompts";
import { searchFile,webSearch } from "../../../lib/tools";
import { createAgent } from "langchain";


export const phaseGeneration = createAgent({
    model: groq,
    tools: [webSearch, searchFile],
    systemPrompt: PHASE_GENERATION_AGENT_PROMPT,
});

export const phasePlanningAgent = createAgent({
    model: llm,
    tools: [webSearch, searchFile],
    systemPrompt: YOLO_PLANNED_AGENT_PROMPT,
});
