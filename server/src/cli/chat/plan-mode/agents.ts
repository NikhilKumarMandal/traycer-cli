import { createAgent } from "langchain";
import { llm, model } from "../../../lib/model";
import { createFile, deleteFile, runCommand, searchFile,updateFile,webSearch } from "../../../lib/tools";
import { CODING_AGENT_PROMPT, PLANNED_AGENT_PROMPT, VERIFICATION_AGENT_PROMPT } from "../../../lib/prompts";



export const plannedAgent = createAgent({
    model: llm,
    tools: [webSearch, searchFile],
    systemPrompt: PLANNED_AGENT_PROMPT,
})

export const codingAgent = createAgent({
    model: model,
    tools: [createFile, updateFile, searchFile, runCommand, deleteFile],
    systemPrompt: CODING_AGENT_PROMPT,
})

export const verificationAgent = createAgent({
    model: model,
    tools: [searchFile],
    systemPrompt: VERIFICATION_AGENT_PROMPT
});