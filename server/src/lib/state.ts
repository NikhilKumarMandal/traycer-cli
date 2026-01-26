import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const planGraphState = Annotation.Root({
    ...MessagesAnnotation.spec,

    approved: Annotation<boolean | undefined>(),
    retryCount: Annotation<number>(),
    approvedPlan: Annotation<boolean | undefined>(),
    approvedVerification: Annotation<boolean | undefined>(),
    approvedRetry: Annotation<boolean | undefined>(),

    plan: Annotation<string>(),
    verification: Annotation<string>(),
})

export type GraphState = typeof planGraphState.State;