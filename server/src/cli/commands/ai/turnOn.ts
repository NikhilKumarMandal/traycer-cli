import chalk from "chalk";
import { Command } from "commander";
import yoctoSpinner from "yocto-spinner";
import { getStoredToken } from "../auth/token";
import { select } from "@clack/prompts";
import { findFirst } from "../../../service/user.service";
import { PlanMode } from "../../chat/plan-mode";
import { ReviewMode } from "../../chat/review-mode";



const wakeUpAction = async () => {
    const token = await getStoredToken();

    if (!token?.access_token) {
        console.log(chalk.red("Not authenticated. Please login."));
        return;
    }

    const spinner = yoctoSpinner({ text: "Fetching User Information..." });
    spinner.start();

    const user = await findFirst(token?.access_token);

    spinner.stop();

    if (!user) {
        console.log(chalk.red("User not found."));
        return;
    }

    console.log(chalk.green(`\nWelcome back, ${user.name}!\n`));

    const choice = await select({
        message: "Select an option:",
        options: [
            {
                value: "Plan Mode",
                label: "Plan",
                hint: "Direct, step-by-step implementation for single-PR tasks",
            },
            {
                value: "Phases Mode",
                label: "Phases",
                hint: "Structured, multi-phase development for complex projects. Break goals into iterative phases with validation between steps.",
            },
            {
                value: "Review Mode",
                label: "Review",
                hint: "Agentic code review with thorough exploration and analysis.",
            },
        ],
    });

    switch (choice) {
        case "Plan Mode":
            await PlanMode();
            break;
        // case "Phases Mode":
        //     await startPhase();
        //     break;
        case "Review Mode":
            await ReviewMode();
            break;
    }
};

export const turnOn = new Command("turnon")
    .description("Wake up the AI")
    .action(wakeUpAction);