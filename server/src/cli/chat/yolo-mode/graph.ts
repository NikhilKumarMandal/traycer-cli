import { yoloGraphState } from "../../../lib/state";
import { checkIntent, clarifyIntent } from "./agents";









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