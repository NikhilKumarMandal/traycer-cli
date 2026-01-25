import fs from "fs/promises";
import { CONFIG_DIR, TOKEN_FILE } from "./login";
import chalk from "chalk";
import yoctoSpinner from "yocto-spinner";
import { logger } from "better-auth";



export async function getStoredToken() {
    try {
        const data = await fs.readFile(TOKEN_FILE, "utf-8");
        const token = JSON.parse(data);
        return token;
    } catch (error) {
        // File doesn't exist or can't be read
        return null;
    }
};


export async function storeToken(token:any) {
    try {
        // Ensure config directory exists
        await fs.mkdir(CONFIG_DIR, { recursive: true });

        // Store token with metadata
        const tokenData = {
            access_token: token.access_token,
            refresh_token: token.refresh_token, // Store if available
            token_type: token.token_type || "Bearer",
            scope: token.scope,
            expires_at: token.expires_in
                ? new Date(Date.now() + token.expires_in * 1000).toISOString()
                : null,
            created_at: new Date().toISOString(),
        };

        await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2), "utf-8");
        return true;
    } catch (error) {
        console.error(chalk.red("Failed to store token:"), error.message);
        return false;
    }
};

export async function clearStoredToken() {
    try {
        await fs.unlink(TOKEN_FILE);
        return true;
    } catch (error) {
        // File doesn't exist or can't be deleted
        return false;
    }
}

export async function isTokenExpired() {
    const token = await getStoredToken();
    if (!token || !token.expires_at) {
        return true;
    }

    const expiresAt = new Date(token.expires_at);
    const now = new Date();

    // Consider expired if less than 5 minutes remaining
    return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
}

export async function requireAuth() {
    const token = await getStoredToken();

    if (!token) {
        console.log(
            chalk.red("❌ Not authenticated. Please run 'your-cli login' first.")
        );
        process.exit(1);
    }

    if (await isTokenExpired()) {
        console.log(
            chalk.yellow("⚠️  Your session has expired. Please login again.")
        );
        console.log(chalk.gray("   Run: your-cli login\n"));
        process.exit(1);
    }

    return token;
};

export async function pollForToken(
    authClient,
    deviceCode,
    clientId,
    initialInterval
) {
    console.log(typeof authClient);
    console.log(typeof deviceCode);
    console.log(typeof clientId);
    console.log(typeof initialInterval);
    
    let pollingInterval = initialInterval;
    const spinner = yoctoSpinner({ text: "", color: "cyan" });
    let dots = 0;

    return new Promise((resolve) => {
        const poll = async () => {
            dots = (dots + 1) % 4;
            spinner.text = chalk.gray(
                `Polling for authorization${".".repeat(dots)}${" ".repeat(3 - dots)}`
            );
            if (!spinner.isSpinning) spinner.start();

            try {
                const { data, error } = await authClient.device.token({
                    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
                    device_code: deviceCode,
                    client_id: clientId,
                    fetchOptions: {
                        headers: {
                            "user-agent": `Better Auth CLI`,
                        },
                    },
                });

                if (data?.access_token) {
                    console.log(
                        chalk.bold.yellow(`Your access token: ${data.access_token}`)
                    );
                    spinner.stop();
                    resolve(data);
                    return;
                } else if (error) {
                    switch (error.error) {
                        case "authorization_pending":
                            // Continue polling
                            break;
                        case "slow_down":
                            pollingInterval += 5;
                            break;
                        case "access_denied":
                            spinner.stop();
                            logger.error("Access was denied by the user");
                            process.exit(1);
                            break;
                        case "expired_token":
                            spinner.stop();
                            logger.error("The device code has expired. Please try again.");
                            process.exit(1);
                            break;
                        default:
                            spinner.stop();
                            logger.error(`Error: ${error.error_description}`);
                            process.exit(1);
                    }
                }
            } catch (err) {
                spinner.stop();
                logger.error(`Network error: ${err.message}`);
                process.exit(1);
            }

            setTimeout(poll, pollingInterval * 1000);
        };

        setTimeout(poll, pollingInterval * 1000);
    });
}
