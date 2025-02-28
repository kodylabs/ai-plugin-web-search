import { encodingForModel, type TiktokenModel } from "js-tiktoken";

export const DEFAULT_MAX_WEB_SEARCH_TOKENS = 4000;
export const DEFAULT_MODEL_ENCODING = "gpt-3.5-turbo";

export interface SearchParams {
    limit?: number;
    type?: "news" | "general";
}

export function getTotalTokensFromString(
    str: string,
    encodingName: TiktokenModel = DEFAULT_MODEL_ENCODING
) {
    const encoding = encodingForModel(encodingName);
    return encoding.encode(str).length;
}

export function MaxTokens(
    data: string,
    maxTokens: number = DEFAULT_MAX_WEB_SEARCH_TOKENS
): string {
    if (getTotalTokensFromString(data) >= maxTokens) {
        return data.slice(0, maxTokens);
    }
    return data;
}

export function isValidSearchParams(params: any): params is SearchParams {
    if (typeof params !== 'object' || params === null) {
        return false;
    }
    
    // Check limit
    if ('limit' in params) {
        if (typeof params.limit === 'string') {
            const parsedLimit = parseInt(params.limit, 10);
            if (isNaN(parsedLimit) || parsedLimit < 1) {
                return false;
            }
            params.limit = parsedLimit;
        } else if (typeof params.limit !== 'number' || params.limit < 1 || !Number.isInteger(params.limit)) {
            return false;
        }
    }
    
    // Check type
    if ('type' in params) {
        if (typeof params.type !== 'string' || (params.type !== 'news' && params.type !== 'general')) {
            return false;
        }
    }
    
    return true;
} 