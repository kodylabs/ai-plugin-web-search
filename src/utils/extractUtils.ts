import { encodingForModel, type TiktokenModel } from "js-tiktoken";
import type { ExtractOptions, SuccessfulExtractResult, FailedExtractResult, ExtractResponse } from "../types";
import { elizaLogger } from "@elizaos/core";

export const DEFAULT_MAX_EXTRACT_TOKENS = 8000;
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
    maxTokens: number = DEFAULT_MAX_EXTRACT_TOKENS
): string {
    if (getTotalTokensFromString(data) >= maxTokens) {
        return data.slice(0, maxTokens);
    }
    return data;
}

/**
 * Validate extracted URLs
 */
export function validateUrls(urls: string[]): string[] {
    if (!urls || !Array.isArray(urls)) {
        return [];
    }

    return urls.filter(url => {
        try {
            // Check if URL is valid
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    });
}

/**
 * Validate extraction parameters
 */
export function isValidExtractParams(params: any): params is ExtractOptions {
    if (typeof params !== 'object' || params === null) {
        return false;
    }
    
    // Check if the object has at least one of the expected properties
    const hasExpectedProperties = 'includeImages' in params || 'extractDepth' in params || 'urls' in params;
    if (!hasExpectedProperties) {
        return false;
    }
    
    // Check includeImages if present
    if ('includeImages' in params) {
        // Accept booleans and 'true'/'false' strings
        if (typeof params.includeImages !== 'boolean') {
            // If it's a string, accept 'true' or 'false'
            if (typeof params.includeImages === 'string') {
                const lowerValue = params.includeImages.toLowerCase();
                if (lowerValue !== 'true' && lowerValue !== 'false') {
                    return false;
                }
                // Accept the string, it will be converted later
            } else {
                return false;
            }
        }
    }
    
    // Check extractDepth if present
    if ('extractDepth' in params) {
        if (typeof params.extractDepth !== 'string') {
            return false;
        }
        
        const validDepths = ['basic', 'advanced'];
        if (!validDepths.includes(params.extractDepth.toLowerCase())) {
            return false;
        }
    }
    
    // Check urls if present
    if ('urls' in params) {
        if (!Array.isArray(params.urls)) {
            return false;
        }
        
        // Check that all elements are strings
        if (params.urls.some(url => typeof url !== 'string')) {
            return false;
        }
    }
    
    return true;
}

/**
 * Format extracted content to make it more readable
 */
export function formatExtractedContent(content: string): string {
    if (!content) return '';
    
    // Remove excessive spaces and line breaks
    let formatted = content.replace(/\s+/g, ' ');
    
    // Limit content size
    return MaxTokens(formatted);
}

/**
 * Create an empty extraction response
 */
export function createEmptyExtractResponse(): ExtractResponse {
    return {
        results: [],
        failed_results: [],
        response_time: 0
    };
}

/**
 * Merge multiple extraction responses into one
 */
export function mergeExtractResponses(responses: ExtractResponse[]): ExtractResponse {
    if (!responses || responses.length === 0) {
        return createEmptyExtractResponse();
    }
    
    const merged: ExtractResponse = {
        results: [],
        failed_results: [],
        response_time: 0
    };
    
    for (const response of responses) {
        if (response.results) {
            merged.results = [...merged.results, ...response.results];
        }
        
        if (response.failed_results) {
            merged.failed_results = [...merged.failed_results, ...response.failed_results];
        }
        
        merged.response_time += response.response_time || 0;
    }
    
    return merged;
}

/**
 * Normalize extraction parameters by fixing types and setting default values
 */
export function normalizeExtractParams(params: any): ExtractOptions & { urls: string[] } {
    const normalizedParams: ExtractOptions & { urls: string[] } = {
        urls: []
    };
    
    // Fix includeImages if it's a string
    if (typeof params.includeImages === 'string') {
        const lowerValue = String(params.includeImages).toLowerCase();
        normalizedParams.includeImages = lowerValue === 'true';
    } else if (typeof params.includeImages === 'boolean') {
        normalizedParams.includeImages = params.includeImages;
    } else {
        normalizedParams.includeImages = false; // Default value
    }
    
    // Fix extractDepth if necessary
    if (typeof params.extractDepth === 'string') {
        const lowerValue = params.extractDepth.toLowerCase();
        if (lowerValue === 'basic' || lowerValue === 'advanced') {
            normalizedParams.extractDepth = lowerValue as "basic" | "advanced";
        } else {
            normalizedParams.extractDepth = "basic";
        }
    } else {
        normalizedParams.extractDepth = "basic"; // Default value
    }
    
    // Ensure urls is an array
    if (Array.isArray(params.urls)) {
        normalizedParams.urls = params.urls;
    }
    
    return normalizedParams;
} 