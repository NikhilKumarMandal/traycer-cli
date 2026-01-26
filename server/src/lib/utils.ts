
import simpleGit from "simple-git";


const git = simpleGit();

export async function ensureGitRepo() {
    try {
        await git.revparse(["--is-inside-work-tree"]);
    } catch {
        throw new Error(
            "Not inside a Git repository. Run `git init` or cd into a Git project."
        );
    }
}
