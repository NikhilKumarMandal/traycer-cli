import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts";
import { logger } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import chalk from "chalk";
import { Command } from "commander";
import fs from "fs/promises";
import open from "open";
import os from "os";
import path from "path";
import yoctoSpinner from "yocto-spinner";
import * as z from "zod/v4";
import dotenv from "dotenv";
import { LoginActionOpts, loginOptionsSchema } from "./schema";



dotenv.config();


const DEMO_URL = "http://localhost:4000";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");






export async function loginAction(opts: LoginActionOpts) { 

    const options = loginOptionsSchema.parse(opts);

    const serverUrl = options.serverUrl || DEMO_URL;
    const clientId = options.clientId || CLIENT_ID;

    intro(chalk.bold("🔐 Better Auth CLI Login"));

    if (!clientId) {
        logger.error("CLIENT_ID is not set in .env file");
        console.log(
            chalk.red("\n❌ Please set GITHUB_CLIENT_ID in your .env file")
        );
        process.exit(1);
    }
}





export const login = new Command("login")
    .description("Login to Better Auth")
    .option("--server-url <url>", "The Better Auth server URL", DEMO_URL)
    .option("--client-id <id>", "The OAuth client ID", CLIENT_ID)
    .action(loginAction);