import { createAgent } from "langchain";
import { llm, model } from "../../../lib/model";
import { diffForFileTool, gitDiffTargetTool, listChangedFilesTool, searchFile } from "../../../lib/tools";
import { ANALYSIS_AGENT_PROMPT, FIND_ISSUE_AGENT_PROMPT } from "../../../lib/prompts";


export const analysisAgent = createAgent({
    model: llm,
    tools: [searchFile, listChangedFilesTool, diffForFileTool, gitDiffTargetTool],
    systemPrompt: ANALYSIS_AGENT_PROMPT,
});

export const findIssueAgent = createAgent({
    model: model,
    tools: [searchFile],
    systemPrompt: FIND_ISSUE_AGENT_PROMPT,
})

