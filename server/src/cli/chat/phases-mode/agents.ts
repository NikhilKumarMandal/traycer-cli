
import { groq, llm, model } from "../../../lib/model";
import { CHECK_INTENT_AGENT_PROMPT, CLARIFY_INTENT_AGENT_PROMPT, CODING_AGENT_PROMPT, GENERATE_REPORT_AGENT_PROMPT, PHASE_GENERATION_AGENT_PROMPT, REVERIFICATION_AGENT_PROMPT, YOLO_PLANNED_AGENT_PROMPT } from "../../../lib/prompts";
import { createFile, deleteFile, runCommand, searchFile,updateFile,webSearch } from "../../../lib/tools";
import { createAgent } from "langchain";


export const checkIntent = createAgent({
    model: groq,
    tools: [webSearch],
    systemPrompt: CHECK_INTENT_AGENT_PROMPT,
});

export const clarifyIntent = createAgent({
    model: groq,
    tools: [webSearch],
    systemPrompt: CLARIFY_INTENT_AGENT_PROMPT
})

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


export const codingAgent = createAgent({
    model: model,
    tools: [createFile, updateFile, searchFile, runCommand, deleteFile],
    systemPrompt: CODING_AGENT_PROMPT,
})

export const verificationAgent = createAgent({
    model: model,
    tools: [searchFile],
    systemPrompt: GENERATE_REPORT_AGENT_PROMPT
});


export const reVerificationAgent = createAgent({
    model: model,
    tools: [webSearch, searchFile],
    systemPrompt: REVERIFICATION_AGENT_PROMPT
});