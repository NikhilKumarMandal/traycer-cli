import { AIMessage } from "langchain";
import { CodeReviewSchema, reviewGraphState } from "../../../lib/state";
import { analysisAgent, findIssueAgent } from "./agents";
import { GENERATE_REPORT_AGENT_PROMPT } from "../../../lib/prompts";
import { llm } from "../../../lib/model";
import { END, interrupt, MemorySaver, StateGraph } from "@langchain/langgraph";
import { codingAgent } from "../plan-mode/agents";



async function analysisNode(state: typeof reviewGraphState.State) {

    const response = await analysisAgent.invoke({
        messages: state.messages,
    } as any);

    return {
        // @ts-ignore
        analysis: response.messages?.at(-1)?.content
    };
};

async function findIssueNode(state: typeof reviewGraphState.State) {
    console.log("-------------- find issue ---------------------");

    const response = await findIssueAgent.invoke({
        messages: state.analysis
    } as any)



    return {
        // @ts-ignore
        findIssue: response.messages?.at(-1)?.content
    };
};

async function generateReportNode(state: typeof reviewGraphState.State) {

    console.log("----------  Generate Report -----------");

    const llmWithStructure = llm.withStructuredOutput(CodeReviewSchema);

    const response = await llmWithStructure.invoke([
        {
            role: 'system',
            content: GENERATE_REPORT_AGENT_PROMPT,
        },
        state.findIssue,
    ]);

    return {
        generateReport: [new AIMessage(JSON.stringify(response))]
    };
};

async function approveCodingAgentNode() {
    const approved = interrupt(
        "Do you want to execute the report to fix the code? (yes/no)"
    );

    return { "approved": approved };
};

async function codingNode(state: typeof reviewGraphState.State) {
    console.log("-----------------------------------------------------");
    console.log("Agent Mode: Coding...");
    console.log("-----------------------------------------------------");

    let inputMessages: any;

    inputMessages = [
            {
                role: "system",
                content: `
                        MODE: FIX EXISTING CODE

                        You are given:
                        - Verification feedback
                        
                        Base on the verfication feedback fix the code..

                        Apply ONLY the required fixes.
                        DO NOT rewrite everything.
                        DO NOT change unrelated files.`
            },
            state.generateReport
    ];
    

    const response = await codingAgent.invoke({
        messages: inputMessages
    } as any)

    console.log("---------------------------------")
    return {
        // @ts-ignore
        code: response.messages?.at(-1)?.content
    }
};

function routeAfterCodingAgentApproval(state: typeof reviewGraphState.State) {
    if (state.approved === true) {
        return "coding";
    }
    return END;
};

export const reviewGraph = new StateGraph(reviewGraphState)
    .addNode("analysis_agent", analysisNode)
    .addNode("findIssue_agent", findIssueNode)
    .addNode("generateReport_agent", generateReportNode)
    .addNode("approved", approveCodingAgentNode)
    .addNode("coding",codingNode)
    .addEdge("__start__", "analysis_agent")
    .addEdge("analysis_agent", "findIssue_agent")
    .addEdge("findIssue_agent", "generateReport_agent")
    .addEdge("generateReport_agent", "approved")
    .addConditionalEdges("approved", routeAfterCodingAgentApproval, {
        coding: "coding",
        [END]: END,
    })
    .compile({
        checkpointer: new MemorySaver(),
    })
    .withConfig({ recursionLimit: 69 })

