import { interrupt, MemorySaver, StateGraph } from "@langchain/langgraph";
import { yoloGraphState } from "../../../lib/state";
import { Phase } from "../../../types";
import { checkIntent, clarifyIntent, codingAgent, phaseGeneration, phasePlanningAgent, reVerificationAgent, verificationAgent } from "./agents";
//import readline from "node:readline/promises";
import { parsePhases } from "../../../lib/utils";
import { HumanMessage } from "langchain";
import chalk from "chalk";



const MAX_FIX_ATTEMPTS = 3;

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });

async function classifyNode(state: typeof yoloGraphState.State) {
    const response = await checkIntent.invoke({
        messages: state.messages
    } as any);

    //@ts-ignore
    const aiMessage = response.messages.at(-1);
    const planText = aiMessage?.content as string;

    return {
        intentStatus: planText
    };
};

async function clarifyIntentNode(state: typeof yoloGraphState.State) {

    const response = await clarifyIntent.invoke({
        messages: state.messages
    } as any);

    //@ts-ignore
    const aiMessage = response.messages.at(-1);
    const planText = aiMessage?.content as string;

    return {
        questions: planText
    }

};

async function phaseGenerationNode(state: typeof yoloGraphState.State) {
    console.log(chalk.blue("\n -------------- Phase Generation ----------------- \n"));

    let finalPrompt = "";

    if (state.intentStatus === "NEEDS_CLARIFICATION") {
        const answer = interrupt(
            "Please answer the clarification questions above in a single response."
        );
        // query = await rl.question("You: ");


        finalPrompt = `
You are generating a phased technical plan.

Original user query:
${state.messages}

Clarification questions:
${state.questions}

User answers:
// 

Use ALL of this information to generate clear phases.
`;
    }

    else {
        finalPrompt = `
You are generating a phased technical plan.

User query:
${state.messages}

Generate clear, sequential implementation phases.
`;
    }


    const response = await phaseGeneration.invoke({
        messages: finalPrompt,
    } as any);


    //@ts-ignore
    const aiMessage = response.messages.at(-1);
    const planText = aiMessage?.content as string;

    const phases = parsePhases(planText);

    return {
        phases,
        currentPhaseIndex: 0,
    };
}

async function phasePlanning(state: typeof yoloGraphState.State) {
    console.log(chalk.blue("\n -------------- ----- ----------------- \n"));
    
    console.log(chalk.yellow("\n phase: \n",state.currentPhaseIndex));


    const phase = state.phases[state.currentPhaseIndex!] as unknown as Phase;



    const phaseText = `
Title: ${phase.title}
Steps:
${phase.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}
`;


    const response = await phasePlanningAgent.invoke({
        messages: [
            new HumanMessage({ content: phaseText })
        ]
    } as any);
    //@ts-ignore
    const aiMessage = response.messages.at(-1);
    const planText = aiMessage?.content as string;

    return {
        phasePlan: planText
    }

};

async function codingNode(state: typeof yoloGraphState.State) {
    console.log(chalk.blue("\n --------------------------------- \n"));

    console.log(chalk.yellow("\n Agent Mode: Coding... \n"));

    console.log(chalk.blue("\n --------------------------------- \n"));

    let inputMessages;

    if (!state.verification) {
        inputMessages = [
            ...state.phasePlan!,
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

    console.log("Agent Mode: Generating your application...");

    const response = await codingAgent.invoke({
        messages: inputMessages
    } as any)

    console.log(chalk.blue("\n --------------------------------- \n"));
    return {
        //@ts-ignore
        code: response.messages?.at(-1)?.content
    }
};

async function verificationNode(state: typeof yoloGraphState.State) {

    console.log(chalk.yellow("\n Verification started....  \n"));

    const response = await verificationAgent.invoke({
        messages: state.phasePlan
    } as any)

    return {
        //@ts-ignore
        verification: response.messages?.at(-1)?.content
    }
};

async function reVerificationNode(state: typeof yoloGraphState.State) {

    console.log(chalk.yellow("\n Re-verification started....  \n"));

    const response = await reVerificationAgent.invoke({
        messages: state.verification
    }as any);

    //@ts-ignore
    const decision = response.messages.at(-1)?.content as string;

    return {
        reVerificationDecision: decision,
        reVerificationAttempts:
            decision.includes("FIX_REQUIRED")
                ? (state.reVerificationAttempts ?? 0) + 1
                : 0
    };
};

function checkIntentIs(state: typeof yoloGraphState.State) {
    if (state.intentStatus === "CLEAR") {
        return "phaseGeneration";
    };

    return "clarifyIntent"

};

async function nextPhaseNode(state: typeof yoloGraphState.State) {
    const nextIndex = (state.currentPhaseIndex ?? 0) + 1;

    if (nextIndex >= state.phases.length) {
        return {
            done: true
        };
    }

    return {
        currentPhaseIndex: nextIndex,
        reVerificationAttempts: 0
    };
};

function routeAfterReVerification(state: typeof yoloGraphState.State) {
    const decision = state.reVerificationDecision as string;
    const attempts = state.reVerificationAttempts ?? 0;

    if (decision.includes("PHASE_COMPLETE")) {
        return "nextPhase";
    }

    if (decision.includes("FIX_REQUIRED")) {
        if (attempts >= MAX_FIX_ATTEMPTS) {
            console.log("⚠️ Max fix attempts reached, accepting phase");
            return "nextPhase";
        }
        return "coding";
    }

    // fallback
    return "coding";
};



export const phasesGraph = new StateGraph(yoloGraphState)
    .addNode("classify", classifyNode)
    .addNode("clarifyIntent", clarifyIntentNode)
    .addNode("phaseGeneration", phaseGenerationNode)
    .addNode("phasePlanning", phasePlanning)
    .addNode("coding", codingNode)
    .addNode("verificationNode", verificationNode)
    .addNode("reVerification", reVerificationNode)
    .addNode("nextPhase", nextPhaseNode)
    .addEdge("__start__", "classify")
    .addConditionalEdges("classify", checkIntentIs, {
        phaseGeneration: "phaseGeneration",
        clarifyIntent: "clarifyIntent"
    })
    .addEdge("clarifyIntent", "phaseGeneration")
    .addEdge("phaseGeneration", "phasePlanning")
    .addEdge("phasePlanning", "coding")
    .addEdge("coding", "verificationNode")
    .addEdge("verificationNode", "reVerification")
    .addConditionalEdges("reVerification", routeAfterReVerification, {
        coding: "coding",
        nextPhase: "nextPhase"
    })
    .addConditionalEdges("nextPhase", (state) => {
        if (state.done) return "__end__";
        return "phasePlanning";
    }, {
        phasePlanning: "phasePlanning",
        __end__: "__end__"
    })
    .compile({
        checkpointer: new MemorySaver(),
    })
    .withConfig({ recursionLimit: 70 })