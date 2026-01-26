import { tool } from "langchain";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { TavilySearch } from "@langchain/tavily";
import { execSync } from "child_process";


export const webSearch = tool(
    async ({ query, maxResults = 5 }) => {
        const tavilySearch = new TavilySearch({
            maxResults
        });


        return await tavilySearch.invoke({
            query,
            name: tool.name,
        });
    },
    {
        name: "web_search",
        description:
            "Perform autonomous web research to gather external technical context, best practices, or documentation.",
        schema: z.object({
            query: z.string().describe("Search query decided by the planner"),
            maxResults: z.number().optional().default(5),
        }),
    }
);

export const searchFile = tool(
    async ({ repo }: { repo?: string }) => {

        const rootDir = repo ? path.resolve(repo) : process.cwd();

        const filesContent: Record<string, string> = {};


        function walk(dir: string) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !["node_modules"].includes(file)) {
                    walk(fullPath);
                } else if (stat.isFile()) {
                    try {
                        const content = fs.readFileSync(fullPath, "utf-8");

                        const relativePath = path.relative(rootDir, fullPath);
                        filesContent[relativePath] = content;
                    } catch (err) {
                        continue;
                    }
                }
            }
        }

        walk(rootDir);

        return filesContent;
    },
    {
        name: "search_file",
        description:
            "Reads all project files in the current folder or specified repo. AI can autonomously pick what files to use for planning.",
        schema: z.object({
            repo: z.string().optional(),
        }),
    }
);

export const createFile = tool(
    async ({ filePath, content }) => {
        const fullPath = path.join(process.cwd(), filePath);

        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content, "utf-8");

        return `File created: ${filePath}`;
    },
    {
        name: "create_file",
        description: "Create a new file with given content",
        schema: z.object({
            filePath: z.string(),
            content: z.string(),
        }),
    }
);

export const updateFile = tool(
    async ({ filePath, content }) => {
        const fullPath = path.join(process.cwd(), filePath);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        fs.writeFileSync(fullPath, content, "utf-8");
        return `File updated: ${filePath}`;
    },
    {
        name: "update_file",
        description: "Overwrite an existing file",
        schema: z.object({
            filePath: z.string(),
            content: z.string(),
        }),
    }
);

export const deleteFile = tool(
    async ({ filePath }) => {
        const fullPath = path.join(process.cwd(), filePath);

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            return `File deleted: ${filePath}`;
        }

        return `File not found: ${filePath}`;
    },
    {
        name: "delete_file",
        description: "Delete a file from the project",
        schema: z.object({
            filePath: z.string(),
        }),
    }
);

export const runCommand = tool(
    async ({ command }) => {
        try {
            const output = execSync(command, {
                encoding: "utf-8",
                stdio: ["ignore", "pipe", "pipe"],
            });

            return output.slice(0, 30_000); // safety limit
        } catch (err: any) {
            return err.stderr?.toString() || err.message;
        }
    },
    {
        name: "run_command",
        description: "Execute a shell command and return output",
        schema: z.object({
            command: z.string().describe("Shell command to execute"),
        }),
    }
);