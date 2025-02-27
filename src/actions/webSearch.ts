import {
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    elizaLogger,
    composeContext,
    generateObjectDeprecated,
    ModelClass
} from "@elizaos/core";
import { encodingForModel, type TiktokenModel } from "js-tiktoken";
import { WebSearchService } from "../services/webSearchService";
import type { SearchResult } from "../types";

const DEFAULT_MAX_WEB_SEARCH_TOKENS = 4000;
const DEFAULT_MODEL_ENCODING = "gpt-3.5-turbo";

function getTotalTokensFromString(
    str: string,
    encodingName: TiktokenModel = DEFAULT_MODEL_ENCODING
) {
    const encoding = encodingForModel(encodingName);
    return encoding.encode(str).length;
}

function MaxTokens(
    data: string,
    maxTokens: number = DEFAULT_MAX_WEB_SEARCH_TOKENS
): string {
    if (getTotalTokensFromString(data) >= maxTokens) {
        return data.slice(0, maxTokens);
    }
    return data;
}

// Template to extract search parameters
const searchParamsTemplate = `
Analyze the user's search query and extract the following parameters:
1. The number of results the user wants (default: 1)
2. The type of search (news or general, default: general)

Return a JSON object with these parameters:

Example response:
\`\`\`json
{
    "limit": 3,
    "type": "news"
}
\`\`\`

If the user doesn't specify a number of results, set "limit" to 1.
If the user doesn't specify a type, set "type" to "general".

Here are some examples of how to interpret user queries:
- "Find me 5 articles about AI" → limit: 5, type: "general"
- "What are the latest news about SpaceX?" → limit: 1, type: "news"
- "Give me multiple sources about climate change" → limit: 5, type: "general"
- "Find detailed information about quantum computing" → limit: 3, type: "general"
- "Show me recent developments in blockchain" → limit: 3, type: "news"

User query: {{message}}

Extract the search parameters from the query above. Respond with a JSON markdown block.
`;

// Interface for extracted search parameters
interface SearchParams {
    limit?: number;  // Controls the maxResults parameter in the Tavily API call
    type?: "news" | "general";
}

// Function to validate extracted search parameters
function isValidSearchParams(params: any): params is SearchParams {
    if (typeof params !== 'object' || params === null) return false;
    
    // Check limit
    if ('limit' in params && 
        (typeof params.limit !== 'number' || params.limit < 1 || !Number.isInteger(params.limit))) {
        return false;
    }
    
    // Check type
    if ('type' in params && 
        (typeof params.type !== 'string' || (params.type !== 'news' && params.type !== 'general'))) {
        return false;
    }
    
    return true;
}

export const webSearch: Action = {
    name: "WEB_SEARCH",
    similes: [
        "SEARCH_WEB",
        "INTERNET_SEARCH",
        "LOOKUP",
        "QUERY_WEB",
        "FIND_ONLINE",
        "SEARCH_ENGINE",
        "WEB_LOOKUP",
        "ONLINE_SEARCH",
        "FIND_INFORMATION",
    ],
    suppressInitialMessage: true,
    description:
        "Perform a web search to find information related to the message.",
    // eslint-disable-next-line
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const tavilyApiKeyOk = !!runtime.getSetting("TAVILY_API_KEY");

        return tavilyApiKeyOk;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Composing state for message:", message);
        state = (await runtime.composeState(message)) as State;
        const userId = runtime.agentId;
        elizaLogger.log("User ID:", userId);

        const webSearchPrompt = message.content.text;
        elizaLogger.log("web search prompt received:", webSearchPrompt);

        try {
            // Extract search parameters using LLM
            const searchParamsContext = composeContext({
                state: {
                    ...state,
                    message: webSearchPrompt
                },
                template: searchParamsTemplate
            });

            const searchParams = await generateObjectDeprecated({
                runtime,
                context: searchParamsContext,
                modelClass: ModelClass.SMALL,
            });

            // Validate extracted parameters
            if (!isValidSearchParams(searchParams)) {
                elizaLogger.warn("Invalid search parameters, using defaults");
            }
            
            elizaLogger.log("Extracted search parameters:", searchParams);

            // The 'limit' parameter from searchParams is passed to the WebSearchService
            // where it's used as the 'maxResults' parameter in the Tavily API call
            const webSearchService = new WebSearchService();
            await webSearchService.initialize(runtime);
            const searchResponse = await webSearchService.search(
                webSearchPrompt,
                isValidSearchParams(searchParams) ? searchParams : undefined
            );

            if (searchResponse && searchResponse.results.length) {
                const responseList = searchResponse.answer
                    ? `${searchResponse.answer}${
                          Array.isArray(searchResponse.results) &&
                          searchResponse.results.length > 0
                              ? `\n\nFor more details, you can check out these resources:\n${searchResponse.results
                                    .map(
                                        (result: SearchResult, index: number) =>
                                            `${index + 1}. [${result.title}](${result.url})`
                                    )
                                    .join("\n")}`
                              : ""
                      }`
                    : "";

                callback({
                    text: MaxTokens(responseList, DEFAULT_MAX_WEB_SEARCH_TOKENS),
                });
            } else {
                elizaLogger.error("search failed or returned no data.");
            }
        } catch (error) {
            elizaLogger.error("Error in web search handler:", error);
            callback({
                text: `Error performing web search: ${error.message}`,
            });
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Find the latest news about SpaceX launches.",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here is the latest news about SpaceX launches:",
                    action: "WEB_SEARCH",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you find 3 details about the iPhone 16 release?",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here are the details I found about the iPhone 16 release:",
                    action: "WEB_SEARCH",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What is the schedule for the next FIFA World Cup?",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here is the schedule for the next FIFA World Cup:",
                    action: "WEB_SEARCH",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Check the latest stock price of Tesla." },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here is the latest stock price of Tesla I found:",
                    action: "WEB_SEARCH",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Find 5 trending movies in the US.",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here are the current trending movies in the US:",
                    action: "WEB_SEARCH",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What is the latest score in the NBA finals?",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here is the latest score from the NBA finals:",
                    action: "WEB_SEARCH",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "When is the next Apple keynote event?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here is the information about the next Apple keynote event:",
                    action: "WEB_SEARCH",
                },
            },
        ],
    ],
} as Action;