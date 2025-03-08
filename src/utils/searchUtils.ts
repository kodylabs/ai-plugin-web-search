import { encodingForModel, type TiktokenModel } from "js-tiktoken";
import type { SearchOptions } from "../types";

export const DEFAULT_MAX_WEB_SEARCH_TOKENS = 4000;
export const DEFAULT_MODEL_ENCODING = "gpt-3.5-turbo";

/**
 * Calculate the total number of tokens in a string
 */
export function getTotalTokensFromString(
    str: string,
    encodingName: TiktokenModel = DEFAULT_MODEL_ENCODING
) {
    const encoding = encodingForModel(encodingName);
    return encoding.encode(str).length;
}

/**
 * Limit a string to a maximum number of tokens
 */
export function MaxTokens(
    data: string,
    maxTokens: number = DEFAULT_MAX_WEB_SEARCH_TOKENS
): string {
    if (getTotalTokensFromString(data) >= maxTokens) {
        return data.slice(0, maxTokens);
    }
    return data;
}

/**
 * Validate search parameters and ensure proper types
 */
export function isValidSearchParams(params: any): params is { query: string } & SearchOptions {
    if (typeof params !== 'object' || params === null) {
        return false;
    }

    // Validate query
    if (typeof params.query !== 'string' || params.query.trim().length === 0) {
        return false;
    }

    // Check maxResults
    if ('maxResults' in params) {
        const maxResults = Number(params.maxResults);
        if (isNaN(maxResults) || maxResults < 0 || maxResults > 20) {
            return false;
        }
        params.maxResults = maxResults;
    }

    // Check topic
    if ('topic' in params && !['general', 'news'].includes(params.topic)) {
        return false;
    }

    // Check searchDepth
    if ('searchDepth' in params && !['basic', 'advanced'].includes(params.searchDepth)) {
        return false;
    }

    // Ensure includeAnswer is always true
    params.includeAnswer = true;

    return true;
} 