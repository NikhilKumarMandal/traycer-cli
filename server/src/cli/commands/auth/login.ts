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
import { getStoredToken, isTokenExpired, pollForToken, storeToken } from "./token";



dotenv.config();


const DEMO_URL = "http://localhost:4000";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");






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

    // Check if already logged in
    const existingToken = await getStoredToken();
    const expired = await isTokenExpired();


    if (existingToken && !expired) {
        const shouldReauth = await confirm({
            message: "You're already logged in. Do you want to log in again?",
            initialValue: false,
        });

        if (isCancel(shouldReauth) || !shouldReauth) {
            cancel("Login cancelled");
            process.exit(0);
        }
    }

    // Create the auth client
    const authClient = createAuthClient({
        baseURL: serverUrl,
        plugins: [deviceAuthorizationClient()],
    });

    const spinner = yoctoSpinner({ text: "Requesting device authorization..." });
    spinner.start();

    try {
        // Request device code
        const { data, error } = await authClient.device.code({
            client_id: clientId,
            scope: "openid profile email",
        });

        spinner.stop();

        if (error || !data) {
            logger.error(
                `Failed to request device authorization: ${error?.error_description  || "Unknown error"
                }`
            );

            if (error?.status === 404) {
                console.log(chalk.red("\n❌ Device authorization endpoint not found."));
                console.log(chalk.yellow("   Make sure your auth server is running."));
            } else if (error?.status === 400) {
                console.log(
                    chalk.red("\n❌ Bad request - check your CLIENT_ID configuration.")
                );
            }

            process.exit(1);
        }

        const {
            device_code,
            user_code,
            verification_uri,
            verification_uri_complete,
            interval = 5,
            expires_in,
        } = data;

        // Display authorization instructions
        console.log("");
        console.log(chalk.cyan("📱 Device Authorization Required"));
        console.log("");
        console.log(
            `Please visit: ${chalk.underline.blue(
                verification_uri_complete || verification_uri
            )}`
        );
        console.log(`Enter code: ${chalk.bold.green(user_code)}`);
        console.log("");

        // Ask if user wants to open browser
        const shouldOpen = await confirm({
            message: "Open browser automatically?",
            initialValue: true,
        });

        if (!isCancel(shouldOpen) && shouldOpen) {
            const urlToOpen = verification_uri_complete || verification_uri;
            await open(urlToOpen);
        }

        // Start polling
        console.log(
            chalk.gray(
                `Waiting for authorization (expires in ${Math.floor(
                    expires_in / 60
                )} minutes)...`
            )
        );

        const token = await pollForToken(
            authClient,
            device_code,
            clientId,
            interval
        ) as { access_token: string };

        console.log("Token in login page",token)

        if (token) {
            // Store the token
            const saved = await storeToken(token);

            if (!saved) {
                console.log(
                    chalk.yellow("\n⚠️  Warning: Could not save authentication token.")
                );
                console.log(
                    chalk.yellow("   You may need to login again on next use.")
                );
            }

            // Get user info
            const { data: session } = await authClient.getSession({
                fetchOptions: {
                    headers: {
                        Authorization: `Bearer ${token.access_token}`,
                    },
                },
            });

            outro(
                chalk.green(
                    `✅ Login successful! Welcome ${session?.user?.name || session?.user?.email || "User"
                    }`
                )
            );

            console.log(chalk.gray(`\n📁 Token saved to: ${TOKEN_FILE}`));
            console.log(
                chalk.gray("   You can now use AI commands without logging in again.\n")
            );
        }
    } catch (err) {
        spinner.stop();
        console.error(chalk.red("\nLogin failed:"), err.message);
        process.exit(1);
    }

}





export const login = new Command("login")
    .description("Login to Better Auth")
    .option("--server-url <url>", "The Better Auth server URL", DEMO_URL)
    .option("--client-id <id>", "The OAuth client ID", CLIENT_ID)
    .action(loginAction);