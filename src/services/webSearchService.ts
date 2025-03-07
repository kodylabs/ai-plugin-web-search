import {
    Service,
    type IAgentRuntime,
    ServiceType,
} from "@elizaos/core";
import { tavily } from "@tavily/core";
import type { 
    IWebSearchService, 
    SearchOptions, 
    SearchResponse,
    TavilyClient
} from "../types";

export class WebSearchService extends Service implements IWebSearchService {
    public tavilyClient: TavilyClient

    async initialize(_runtime: IAgentRuntime): Promise<void> {
        const apiKey = _runtime.getSetting("TAVILY_API_KEY") as string;
        if (!apiKey) {
            throw new Error("TAVILY_API_KEY is not set");
        }
        this.tavilyClient = tavily({ apiKey });
    }

    getInstance(): IWebSearchService {
        return WebSearchService.getInstance();
    }

    static get serviceType(): ServiceType {
        return ServiceType.WEB_SEARCH;
    }

    async search(
        query: string,
        options?: SearchOptions,
    ): Promise<SearchResponse> {
        try {
            const tavilyOptions = {
                searchDepth: options?.searchDepth || "basic",
                topic: options?.topic || "general",
                days: options?.days || 3,
                maxResults: options?.maxResults || 1,
                includeImages: options?.includeImages || false,
                includeImageDescriptions: options?.includeImageDescriptions || false,
                includeAnswer: options?.includeAnswer ?? true,
                includeRawContent: options?.includeRawContent || false,
                includeDomains: options?.includeDomains,
                excludeDomains: options?.excludeDomains,
                maxTokens: options?.maxTokens
            };
            
            const response = await this.tavilyClient.search(query, tavilyOptions);
            
            return response;
        } catch (error) {
            throw error;
        }
    }
}
