import { tool } from "langchain";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { TavilySearch } from "@langchain/tavily";
import { execSync } from "child_process";
import simpleGit from "simple-git";
import { ensureGitRepo } from "./utils";


const git = simpleGit();



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

// Plans Tool

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







// Reviews Tool

export const listChangedFilesTool = tool(
    async () => {
        await ensureGitRepo();

        const result = await git.diff(["--name-only"]);

        const files = result
            .split("\n")
            .map(f => f.trim())
            .filter(Boolean);

        return {
            changed_files: files,
            count: files.length,
        };
    },
    {
        name: "list_changed_files",
        description:
            "List all files with uncommitted changes. Use this first to decide what to review.",
        schema: z.object({}),
    }
);

export const diffForFileTool = tool(
    async ({ file }) => {
        await ensureGitRepo();

        const diff = await git.diff([file]);

        if (!diff.trim()) {
            return { file, diff: "No changes found." };
        }

        return { file, diff };
    },
    {
        name: "get_diff_for_file",
        description:
            "Get the git diff for a specific file. Use only after selecting important files.",
        schema: z.object({
            file: z.string().describe("Path of the file to diff"),
        }),
    }
);

export const gitDiffTargetTool = tool(
    async ({ target }) => {
        await ensureGitRepo();

        if (target === "uncommitted") {
            return { diff: await git.diff() };
        }

        if (target === "main") {
            await git.fetch(["origin", "main"]);
            return { diff: await git.diff(["origin/main"]) };
        }

        if (target.startsWith("branch:")) {
            const branchName = target.split(":")[1];

            if (!branchName) {
                throw new Error("Expected target format: branch:<branch-name>");
            }

            await git.fetch(["origin", branchName]);
            return { diff: await git.diff([`origin/${branchName}`]) };
        }

        throw new Error("Invalid target. Use uncommitted | main | branch:<name>");
    },
    {
        name: "git_diff_target",
        description:
            "Get git diff for uncommitted changes or compared against main or another branch.",
        schema: z.object({
            target: z
                .string()
                .describe("uncommitted | main | branch:<branch-name>"),
        }),
    }
);