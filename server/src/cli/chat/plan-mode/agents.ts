import { createAgent } from "langchain";
import { llm, model } from "../../../lib/model";
import { createFile, runCommand, searchFile,webSearch } from "../../../lib/tools";
import { CODING_AGENT_PROMPT, GENERATE_REPORT_AGENT_PROMPT, PLANNED_AGENT_PROMPT } from "../../../lib/prompts";



export const plannedAgent = createAgent({
    model: llm,
    tools: [webSearch, searchFile],
    systemPrompt: PLANNED_AGENT_PROMPT,
})

export const codingAgent = createAgent({
    model: model,
    tools: [createFile, searchFile, runCommand],
    systemPrompt: CODING_AGENT_PROMPT,
})

export const verificationAgent = createAgent({
    model: model,
    tools: [searchFile],
    systemPrompt: GENERATE_REPORT_AGENT_PROMPT
});