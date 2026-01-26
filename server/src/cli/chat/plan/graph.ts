import {
    StateGraph,
    START,
    END,
    interrupt,
    MemorySaver,
} from "@langchain/langgraph";
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { createAgent } from "langchain";
import { AIMessage } from "@langchain/core/messages";
import { groq } from "./model";
import { webSearch } from "./tools";
import { graphState } from "./state";

/* ---------- STATE ---------- */
const plannedAgent = createAgent({
    model: groq,
    tools: [webSearch],
    systemPrompt: `you are very helpful professional assitant
    and you have web search tool also
  `,
})


async function plannerNode(state: typeof graphState.State) {
    console.log("Start planning...")
    //@ts-ignore
    const response = await plannedAgent.invoke({
        messages: state.messages,
    }) 

    return {
        // @ts-ignore
        plan: response.messages?.at(-1)?.content
    };
}


async function approvalNode(state: typeof graphState.State) {
    const approved = interrupt("Do you approve this action? (yes/no)");

    if (approved === "true") {
        return { approved: true }
    } else {
        return { approved: false }
    }


}



async function codingNode(state: typeof graphState.State) {

    console.log("Start planning...")


    console.log("-------------------------------------------------------")
    console.log("-------------------------------------------------------")
    console.log("-------------------------------------------------------")

    console.log("Plan", state.plan)
}






export const graph = new StateGraph(graphState)
    .addNode("planner", plannerNode)
    .addNode("approval", approvalNode)
    .addNode("coder", codingNode)
    .addEdge(START, "planner")
    .addEdge("planner", "approval")
    .addEdge("approval", "coder")
    .addEdge("coder", END)
    .compile({
        checkpointer: new MemorySaver(),
    });
