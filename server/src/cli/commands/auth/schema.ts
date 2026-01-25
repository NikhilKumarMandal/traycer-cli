import * as z from "zod/v4";

export const loginOptionsSchema = z.object({
    serverUrl: z.string().optional(),
    clientId: z.string().optional(),
});

export type LoginActionOpts = z.infer<typeof loginOptionsSchema>;