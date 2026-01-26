import { graph } from "./graph";

export async function runGraph(messages: any[]) {
    return graph.stream(
        { messages },
        {
            streamMode: ["messages", "custom"],
            configurable: { thread_id: "orbit-chat" },
        }
    );
}
