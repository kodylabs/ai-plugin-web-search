import type { Service } from "@elizaos/core";
import { tavily } from "@tavily/core";
import { z } from "zod";

export type TavilyClient = ReturnType<typeof tavily>;

// Web Search Service
export interface IWebSearchService extends Service {
    search(query: string, options?: SearchOptions): Promise<SearchResponse>;
}

export type SearchResult = {
    title: string;
    url: string;
    content?: string;
    score?: number;
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
 * Aligned with Tavily API options
 */
export interface SearchOptions {
    /** The depth of the search ("basic" or "advanced") */
    searchDepth?: "basic" | "advanced";

    /** The category of the search */
    topic?: "general" | "news" | "finance";

    /** Number of days back from current date (for "news" topic). Default: 3 */
    days?: number;

    /** Maximum number of results (0-20). Default: 5 */
    maxResults?: number;

    /** Include images in the response */
    includeImages?: boolean;

    /** Include descriptions for images */
    includeImageDescriptions?: boolean;

    /** Include a generated answer */
    includeAnswer?: boolean;

    /** Include raw content in results */
    includeRawContent?: boolean;

    /** List of domains to include in search */
    includeDomains?: string[];

    /** List of domains to exclude from search */
    excludeDomains?: string[];

    /** Maximum tokens in the response */
    maxTokens?: number;
}

export const SearchParamsSchema = z.object({
    query: z.string(),
    topic: z.enum(["general", "news"]).optional(),
    maxResults: z.number().min(1).max(10).optional(),
    days: z.number().optional(),
    includeImages: z.boolean().optional(),
    includeImageDescriptions: z.boolean().optional(),
    includeRawContent: z.boolean().optional(),
    includeDomains: z.array(z.string()).optional(),
    excludeDomains: z.array(z.string()).optional(),
    searchDepth: z.enum(["basic", "advanced"]).optional(),
    timeRange: z.enum(["day", "week", "month", "year", "d", "w", "m", "y"]).optional()
});

// Web Extract Service
export interface IWebExtractService extends Service {
    extract(
        urls: string[],
        options?: ExtractOptions,
    ): Promise<ExtractResponse>;
}

/**
 * Options for web extraction
 */
export interface ExtractOptions {
    includeImages?: boolean; // Include images
    extractDepth?: "basic" | "advanced";
}

/**
 * Successful result from extraction
 */
export type SuccessfulExtractResult = {
    url: string;
    raw_content: string;
    images?: string[]; // Only available if includeImages is set to true
};

/**
 * Failed result from extraction
 */
export type FailedExtractResult = {
    url: string;
    error: string;
};

/**
 * Response from web extraction API
 */
export type ExtractResponse = {
    results: SuccessfulExtractResult[];
    failed_results: FailedExtractResult[];
    response_time: number;
};