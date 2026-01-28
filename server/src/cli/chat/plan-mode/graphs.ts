import { END, interrupt, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { planGraphState } from "../../../lib/state";
import { codingAgent, plannedAgent, verificationAgent } from "./agents";
import chalk from "chalk";



async function plannerNode(state: typeof planGraphState.State) {
    console.log(chalk.green("\nA Start planning... \n"));
    const response = await plannedAgent.invoke({
        messages: state.messages,
    } as any);

    return {
        // @ts-ignore
        plan: response.messages?.at(-1)?.content
    };
};

async function approvePlanNode() {
    const approved = interrupt(
        "Do you want to execute the plan and generate code? (yes/no)"
    );

    return { "approvedPlan": approved };
};

async function codingNode(state: typeof planGraphState.State) {
    console.log(chalk.blue("\n --------------------------------- \n"));

    console.log(chalk.yellow("\n Agent Mode: Coding... \n"));

    console.log(chalk.blue("\n --------------------------------- \n"));


    let inputMessages: any;

    if (!state.verification) {
        inputMessages = [
            state.plan,
            {
                role: "system",
                content: "MODE: IMPLEMENT THE PLAN ABOVE EXACTLY"
            }
        ];
    }
    else {
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
            ...state.verification,
        ];
    }

    console.log(chalk.blue("\n Agent Mode: Generating your application... \n"));

    const response = await codingAgent.invoke({
        messages: inputMessages
    } as any)

    console.log(chalk.blue("\n --------------------------------- \n"));
    return {
        // @ts-ignore
        code: response.messages?.at(-1)?.content
    }
};

async function verificationNode(state: typeof planGraphState.State) {

    console.log(chalk.yellow("\n Verification started....  \n"));


    const response = await verificationAgent.invoke({
        messages: state.plan
    } as any);

    return {
        // @ts-ignore
        verification: response.messages?.at(-1)?.content
    }
};

async function approveVerificationNode() {
    const approved = interrupt(
        "Do you want to verify the generated code? (yes/no)"
    );

    return { "approvedVerification": approved };
};

async function approveRetryNode(state: typeof planGraphState.State) {
    const approved = interrupt(
        "Verification found issues. Retry fixing the code? (yes/no)"
    );

    return {
        "approvedRetry": approved,
        retryCount: state.retryCount + 1,
    };
};

function routeAfterPlanApproval(state: typeof planGraphState.State) {
    if (state.approvedPlan === true) {
        return "coder";
    }
    return END;
};

function routeAfterVerificationApproval(state: typeof planGraphState.State) {
    if (state.approvedVerification === true) {
        return "verifier"
    }
    return END;
};

function routeAfterRetry(state: typeof planGraphState.State) {
    if (!state.approvedRetry) return "end";
    if (state.retryCount >= 3) return "end";
    return "retry";
};



export const planGraph = new StateGraph(planGraphState)
    .addNode("planner", plannerNode)
    .addNode("approve_plan", approvePlanNode)
    .addNode("coder", codingNode)
    .addNode("approve_verification", approveVerificationNode)
    .addNode("verifier", verificationNode)
    .addNode("approve_retry", approveRetryNode)

    // edges
    .addEdge(START, "planner")
    .addEdge("planner", "approve_plan")
    .addConditionalEdges("approve_plan", routeAfterPlanApproval, {
        coder: "coder",
        [END]: END,
    })
    .addEdge("coder", "approve_verification")
    .addConditionalEdges(
        "approve_verification",
        routeAfterVerificationApproval,
        {
            verifier: "verifier",
            [END]: END,
        }
    )
    .addEdge("verifier", "approve_retry")
    .addConditionalEdges("approve_retry", routeAfterRetry, {
        retry: "coder",
        end: END,
    })
    .compile({
        checkpointer: new MemorySaver(),
    })
    .withConfig({ recursionLimit: 70 })


