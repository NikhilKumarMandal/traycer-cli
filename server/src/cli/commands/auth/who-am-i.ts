import chalk from "chalk";
import { requireAuth } from "./token";
import { findFirst } from "../../../service/user.service";
import { Command } from "commander";
import { DEMO_URL } from "./login";




export async function whoamiAction() {
    const token = await requireAuth();

    if (!token?.access_token) {
        console.log("No access token found. Please login.");
        process.exit(1);
    };

    const user = await findFirst(token.access_token)

    // Output user session info
    console.log(
        chalk.bold.greenBright(`\n
            👤 User: ${user.name}
            📧 Email: ${user.email}
            👤 ID: ${user.id}`
        )
    );
};


export const whoami = new Command("whoami")
    .description("Show current authenticated user")
    .option("--server-url <url>", "The Better Auth server URL", DEMO_URL)
    .action(whoamiAction);