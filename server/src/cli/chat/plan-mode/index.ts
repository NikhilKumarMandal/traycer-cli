import { intro} from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { Command } from "@langchain/langgraph";
import readline from "node:readline/promises";
import { graph } from "./graphs";
import { stateWithInterrupt, StreamMessage } from "../../../types";


export async function PlanMode() {
    intro("🚀 Traycer AI CLI");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let interrupts: any[] = []

    while (true) {

        const query = await rl.question("You: ");

        const spinner = yoctoSpinner({ text: "Thinking..." });

        if (query === "/bye") break;

        let input = {
            messages: [
                {
                    role: "human",
                    content: query,
                }
            ]
        };


        if (interrupts.length) {
            //@ts-ignore
            input = new Command({ resume: query === "yes" ? true : "false" });
        };

        spinner.start();

        const stream = await graph.stream(
            input,
            {
                streamMode: ["messages", "custom", "updates"],
                configurable: { thread_id: "1" },
            },

        );

        spinner.stop();

        interrupts = [];

        let fullText = "";
        let toolName = "";

        function safeParse(content: string) {
            try {
                return JSON.parse(content);
            } catch {
                return content;
            }
        }

        for await (const [eventType, chunk] of stream as any) {
            let message: StreamMessage = {} as StreamMessage;
            const _result = (chunk as stateWithInterrupt).__interrupt__;

            if (_result) {
                interrupts.push(_result[0])
                // take user input then reinvoke graph
                console.log("\n\nAI: ", _result[0]?.value)
            }

            if (eventType === 'custom') {
                message = chunk;
            } else if (eventType === 'messages') {
                if (chunk[0].content === '') continue;

                const messageType = chunk[0].type;
                if (messageType === 'ai') {
                    message = {
                        type: 'ai',
                        payload: { text: chunk[0].content as string },
                    };
                } else if (messageType === 'tool') {
                    message = {
                        type: 'tool',
                        payload: {
                            name: chunk[0].name!,
                            result: safeParse(chunk[0].content as string),
                        },
                    };
                }
            }


            if (message.type === 'ai') {
                fullText += message.payload.text
                process.stdout.write(message.payload.text);
            };

            if (message.type === "tool") {
                const toolChunk =
                    `\nTOOL:${message.payload.name} calling `;

                toolName += toolChunk;
                process.stdout.write(toolChunk);
            }

        };
    };

    rl.close();

};

