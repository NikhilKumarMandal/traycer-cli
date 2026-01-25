#!/usr/bin/env node

import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";

import { Command } from "commander";
import { login } from "./commands/auth/login";

dotenv.config();

async function main() {
  console.log(
    chalk.cyanBright(
      figlet.textSync("traycer CLI", {
        font: "Standard",
        horizontalLayout: "default",
      }),
    ),
  );

  console.log(chalk.blue("\nA CLI based AI Tool \n"));

  const program = new Command("traycer");

  program
    .version("0.0.1")
    .description("Traycer CLI - Device Flow Authentication");
  
  
  program.addCommand(login);
    
    program.action(() => {
        program.help();
    });

    program.parse();
}

main().catch((error) => {
  console.error(chalk.red("Error running Orbit CLI:"), error);
  process.exit(1);
});
