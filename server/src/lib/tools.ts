import { tool } from "langchain";
import { z } from "zod";
import { TavilySearch } from "@langchain/tavily";


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