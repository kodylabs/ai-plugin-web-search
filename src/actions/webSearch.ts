import {
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    elizaLogger,
    composeContext,
    generateObject,
    generateText,
    ModelClass,
} from "@elizaos/core";
import { WebSearchService } from "../services/webSearchService";
import { SearchParamsSchema, type SearchResult } from "../types";
import { searchTemplate } from "../templates/searchTemplate";
import { searchResponseTemplate } from "../templates/searchResponseTemplate";
import { MaxTokens, DEFAULT_MAX_WEB_SEARCH_TOKENS } from "../utils/searchUtils";
import { webSearchExamples } from "../examples/webSearchExamples";

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
    description: "Perform a web search to find information related to the message.",
    validate: async (runtime: IAgentRuntime) => {
        return !!runtime.getSetting("TAVILY_API_KEY");
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        state = (await runtime.composeState(message)) as State;
        const recentMessagesData = state.recentMessagesData || [];
        
        const lastAgentMessage = recentMessagesData[recentMessagesData.length - 1];
        const searchMessage = lastAgentMessage?.content?.text;
        
        elizaLogger.warn("Using message for search:", {
            fromAgent: !!lastAgentMessage,
            text: searchMessage
        });

        try {
            const searchParamsContext = composeContext({
                state: {
                    ...state,
                    message: searchMessage
                },
                template: searchTemplate
            });

            const { query, ...options } = (await generateObject({
                runtime,
                context: searchParamsContext,
                modelClass: ModelClass.SMALL,
                schema: SearchParamsSchema,
            })).object as { query: string; [key: string]: any };

            const webSearchService = new WebSearchService();
            await webSearchService.initialize(runtime);

            const searchResponse = await webSearchService.search(query, options);

            if (searchResponse && searchResponse.results.length) {
                const enhancedContext = composeContext({
                    state: {
                        ...state,
                        message: searchMessage,
                        searchResponse: JSON.stringify({
                            query,
                            answer: searchResponse.answer,
                            results: searchResponse.results
                        })
                    },
                    template: searchResponseTemplate
                });

                const enhancedResponse = await generateText({
                    runtime,
                    context: enhancedContext,
                    modelClass: ModelClass.SMALL,
                });
                
                callback({
                    text: MaxTokens(enhancedResponse, DEFAULT_MAX_WEB_SEARCH_TOKENS),
                });
            }
        } catch (error) {
            elizaLogger.error("Web search error:", error);
        }
    },
    examples: webSearchExamples
} as Action;