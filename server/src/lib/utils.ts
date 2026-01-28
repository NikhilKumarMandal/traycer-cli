
import simpleGit from "simple-git";
import { Phase } from "../types";
import { writeFileSync } from 'node:fs';

const git = simpleGit();

export async function ensureGitRepo() {
    try {
        await git.revparse(["--is-inside-work-tree"]);
    } catch {
        throw new Error(
            "Not inside a Git repository. Run `git init` or cd into a Git project."
        );
    }
};


export function parsePhases(text: string): Phase[] {
    const lines = text.split("\n");
    const phases: Phase[] = [];

    let current: Phase | null = null;

    for (const line of lines) {
        const phaseMatch = line.match(/^(\d+)\.\s+(.*)/);
        const stepMatch = line.match(/–\s+(.*)/);

        if (phaseMatch) {
            if (current) phases.push(current);

            current = {
                id: Number(phaseMatch[1]),
                title: phaseMatch[2]?.trim()!,
                steps: [],
                status: "pending",
            };
        }

        if (stepMatch && current && stepMatch[1]) {
            current.steps.push(stepMatch[1].trim());
        }
    }

    if (current) phases.push(current);
    return phases;
};





export async function printGraph(agent: any, graphPath: any) {
    const drawableGraphGraphState = await agent.getGraph();
    const graphStateImage = await drawableGraphGraphState.drawMermaidPng();
    const graphStateArrayBuffer = await graphStateImage.arrayBuffer();

    writeFileSync(graphPath, new Uint8Array(graphStateArrayBuffer));
}