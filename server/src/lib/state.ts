import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import z from "zod";

export const planGraphState = Annotation.Root({
    ...MessagesAnnotation.spec,

    approved: Annotation<boolean | undefined>(),
    retryCount: Annotation<number>(),
    approvedPlan: Annotation<boolean | undefined>(),
    approvedVerification: Annotation<boolean | undefined>(),
    approvedRetry: Annotation<boolean | undefined>(),

    plan: Annotation<string>(),
    verification: Annotation<string>(),
});


export const reviewGraphState = Annotation.Root({
    ...MessagesAnnotation.spec,

    analysis: Annotation<string>(),
    findIssue: Annotation<string>(),
    generateReport: Annotation<string>(),
    approved: Annotation<boolean | undefined>(),
})



export type GraphState = typeof planGraphState.State;




export const ReviewCommentSchema = z.object({
    reasoning: z
        .string()
        .describe("Why this issue belongs to this category"),
    comment: z
        .string()
        .describe("Concrete, actionable review comment"),
});

export const CodeReviewSchema = z.object({
    Bug: z
        .array(ReviewCommentSchema)
        .describe("Logical errors, incorrect behavior, edge cases, crashes"),
    Performance: z
        .array(ReviewCommentSchema)
        .describe("Efficiency, scalability, memory, unnecessary computation"),
    Security: z
        .array(ReviewCommentSchema)
        .describe("Vulnerabilities, secrets, unsafe patterns, attack surfaces"),
    Clarity: z
        .array(ReviewCommentSchema)
        .describe("Readability, maintainability, naming, structure"),
});

