import { intro, text, isCancel, cancel } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { Command } from "@langchain/langgraph";
import readline from "node:readline/promises";
import { graph } from "./graph";
import { graphState } from "../../../lib/state";
import { StreamMessage } from "../../../types";


export async function PlanMode() {
    intro("🚀 Traycer AI CLI");

    // const messages: any[] = [];
    // let awaitingApproval = false;

    // while (true) {
    //     const spinner = yoctoSpinner({ text: "Thinking..." });

    //     // ---------------- RESUME INTERRUPT ----------------
    //     if (awaitingApproval) {
    //         const approval = await text({
    //             message: "Approve the plan? (yes / no)",
    //         });

    //         if (isCancel(approval)) {
    //             cancel("Bye!");
    //             process.exit(0);
    //         }

    //         spinner.start();

    //         const stream = await graph.stream(
    //             new Command({
    //                 resume: true,
    //                 update: {
    //                     approved: approval === "yes",
    //                 },
    //             }),
    //             {
    //                 streamMode: ["messages", "updates"],
    //                 configurable: { thread_id: "1" },
    //             }
    //         );

    //         spinner.stop();
    //         awaitingApproval = false;

    //         await handleStream(stream, messages);
    //         continue;
    //     }

    //     // ---------------- NORMAL USER INPUT ----------------
    //     const input = await text({
    //         message: "Ask something",
    //     });

    //     if (isCancel(input)) {
    //         cancel("Bye!");
    //         process.exit(0);
    //     }

    //     messages.push(new HumanMessage(input));
    //     spinner.start();

    //     const stream = await graph.stream(
    //         { messages }, // ✅ correct place for messages
    //         {
    //             streamMode: ["messages", "updates"],
    //             configurable: { thread_id: "1" },
    //         }
    //     );

    //     spinner.stop();
    //     awaitingApproval = await handleStream(stream, messages);
    // }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let interrupts: any[] = []

    while (true) {

        const query = await rl.question("You: ");

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


        const stream = await graph.stream(
            input,
            {
                streamMode: ["messages", "custom", "updates"],
                configurable: { thread_id: "1" },
            },

        );

        interrupts = [];

        type stateWithInterrupt = typeof graphState.State & {
            __interrupt__: {
                id: string,
                value: string
            }[]
        }

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

        }

    };

    rl.close();

}


// async function handleStream(stream: any, messages: any[]) {
//     let assistantReply = "";
//     let interrupted = false;

//     for await (const [eventType, chunk] of stream) {
//         // ---------- INTERRUPT ----------
//         if (chunk?.__interrupt__) {
//             console.log("\n🤖 AI wants approval:\n");
//             console.log(chunk.__interrupt__[0].value);
//             interrupted = true;
//             break;
//         }

//         // ---------- AI STREAM ----------
//         if (eventType === "messages") {
//             const msg = chunk[0];
//             if (msg?.type === "ai" && msg.content) {
//                 assistantReply += msg.content;
//                 process.stdout.write(msg.content);
//             }
//         }
//     }

//     if (assistantReply) {
//         messages.push({ role: "assistant", content: assistantReply });
//         console.log("\n");
//         displayMessages(messages.slice(-2));
//     }

//     return interrupted;
// }
