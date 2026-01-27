import { planGraphState } from "../lib/state";


// Discriminated unions
export type StreamMessage =
    | {
        type: 'ai';
        payload: {
            text: string
        };
    }
    | {
        type: 'toolCall:start';
        payload: {
            name: string;
            args: Record<string, any>;
        };
    }
    | {
        type: 'tool';
        payload: {
            name: string;
            result: Record<string, any>;
        };
    }


export type stateWithInterrupt = typeof planGraphState.State & {
    __interrupt__: {
        id: string,
        value: string
    }[]
};

export type Phase = {
    id: number;
    title: string;
    steps: string[];
    status: "pending" | "in_progress" | "done";
};