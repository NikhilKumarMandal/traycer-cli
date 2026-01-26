import { Annotation, MessagesAnnotation } from "@langchain/langgraph";



export const graphState = Annotation.Root({
    ...MessagesAnnotation.spec,
    approved: Annotation<boolean | undefined>(),
    plan: Annotation<string>(),
})

export type GraphState = typeof graphState.State;