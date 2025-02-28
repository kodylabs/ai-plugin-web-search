import type { Service } from "@elizaos/core";

export interface IWebSearchService extends Service {
    search(
        query: string,
        options?: SearchOptions,
    ): Promise<SearchResponse>;
}

export type SearchResult = {
    title: string;
    url: string;
    content: string;
    rawContent?: string;
    score: number;
    publishedDate?: string;
};

export type SearchImage = {
    url: string;
    description?: string;
};


export type SearchResponse = {
    answer?: string;
    query: string;
    responseTime: number;
    images: SearchImage[];
    results: SearchResult[];
};

/**
 * Options for web search
 * Used both for Tavily API options and parameters extracted by the LLM
 */
export interface SearchOptions {
    limit?: number;      // Number of results to return
    type?: "news" | "general";  // Type of search
    includeAnswer?: boolean;    // Include a generated answer
    searchDepth?: "basic" | "advanced";  // Search depth
    includeImages?: boolean;    // Include images
    days?: number;       // Number of days to consider (1 = current day, 2 = last 2 days)
}
