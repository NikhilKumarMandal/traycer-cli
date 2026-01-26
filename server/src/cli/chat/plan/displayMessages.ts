import chalk from "chalk";
import boxen from "boxen";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";


marked.use(
    markedTerminal({
        heading: chalk.green.bold,
        strong: chalk.bold,
        em: chalk.italic,
        code: chalk.cyan,
    }) as any
);

export function displayMessages(messages: any[]) {
    messages.forEach((msg) => {
        const title = msg.role === "user" ? "👤 You" : "🤖 Assistant";
        const color = msg.role === "user" ? "blue" : "green";

        const content =
            msg.role === "assistant"
                ? marked.parse(msg.content ?? "")
                : msg.content;

        console.log(
            boxen(content, {
                padding: 1,
                borderStyle: "round",
                borderColor: color as any,
                title,
            })
        );
    });
}
