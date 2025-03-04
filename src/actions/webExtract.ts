import { 
    type Action, 
    type IAgentRuntime, 
    type Memory, 
    type State, 
    type HandlerCallback,
    elizaLogger,
    composeContext,
    generateObjectDeprecated,
    generateText,
    ModelClass
} from "@elizaos/core";
import { validateUrls, normalizeExtractParams } from "../utils/extractUtils";
import { extractParamsTemplate } from "../templates/extractParamsTemplate";
import { extractResponseTemplate } from "../templates/extractResponseTemplate";
import { webExtractExamples } from "../examples/webExtractExamples";
import { WebExtractService } from "../services/webExtractService";
import type { SuccessfulExtractResult, FailedExtractResult } from "../types";

export const webExtract: Action = {
    name: "WEB_EXTRACT",
    similes: [
        "EXTRACT_FROM_WEB",
        "EXTRACT_FROM_URL",
        "EXTRACT_FROM_PAGE",
        "EXTRACT_FROM_HTML",
        "EXTRACT_FROM_WEB_PAGE",
        "LOOKUP_URL",
        "LOOKUP_WEB_PAGE",
        "LOOKUP_WEB_URL",
        "LOOKUP_WEB_PAGE_URL",
        "WEB_EXTRACT_INFORMATION",
        "WEB_EXTRACT_FROM_URL",
        "WEB_EXTRACT_FROM_PAGE",
        "URL_EXTRACT",
    ],
    suppressInitialMessage: true,
    description: "Perform a web urls information extraction",
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
        let extractResponse;
        let extractionResultsText = "";
        let status = "success"; // Default status

        try {
            // Use the template to extract URLs and options
            const extractParamsContext = composeContext({
                state: {
                    ...state,
                    message: message.content.text
                },
                template: extractParamsTemplate
            });

            const extractParams = await generateObjectDeprecated({
                runtime,
                context: extractParamsContext,
                modelClass: ModelClass.SMALL,
            });
            
            // Normalize parameters using utility function
            const normalizedParams = normalizeExtractParams(extractParams || {});
            
            // Validate URLs
            const validUrls = validateUrls(normalizedParams.urls);

            if (validUrls.length === 0) {
                // No valid URLs found
                extractionResultsText = "No valid URLs were found in the message. Please provide valid URLs starting with http:// or https://.\n";
                status = "no_results";
            } else {
                const webExtractService = new WebExtractService();
                await webExtractService.initialize(runtime);
                
                const extractOptions = {
                    includeImages: normalizedParams.includeImages !== undefined ? normalizedParams.includeImages : false,
                    extractDepth: (normalizedParams.extractDepth as "basic" | "advanced") || "basic"
                };

                try {
                    extractResponse = await webExtractService.extract(validUrls, extractOptions);
                    
                    if (extractResponse && extractResponse.results.length) {
                        // Add successful results
                        extractResponse.results.forEach((result: SuccessfulExtractResult, index: number) => {
                            extractionResultsText += `URL ${index + 1}: ${result.url}\n`;
                            extractionResultsText += `Content: ${result.raw_content}\n`;
                            
                            // Add images if available
                            if (result.images && result.images.length > 0) {
                                extractionResultsText += `Images: ${result.images.length} image(s) found\n`;
                            }
                            
                            extractionResultsText += "\n---\n\n";
                        });
                        
                        // Add failed results
                        if (extractResponse.failed_results && extractResponse.failed_results.length > 0) {
                            extractionResultsText += "URLs not extracted:\n";
                            
                            extractResponse.failed_results.forEach((result: FailedExtractResult, index: number) => {
                                extractionResultsText += `URL ${index + 1}: ${result.url} - Error: ${result.error}\n`;
                            });
                            
                            extractionResultsText += "\n---\n\n";
                        }
                        
                        status = "success";
                    } else {
                        extractionResultsText = "Could not extract content from the provided URLs. Please check that the URLs are accessible and try again.\n";
                        status = "no_results";
                    }
                } catch (error) {
                    elizaLogger.error("Error in web extract handler:", error);
                    extractionResultsText = `An error occurred while extracting from URLs: ${error.message || "Unknown error"}\n`;
                    status = "error";
                }
            }
        } catch (error) {
            elizaLogger.error("Error in web extract handler:", error);
            extractionResultsText = `An error occurred while processing your request: ${error.message || "Unknown error"}`;
            status = "error";
        }
        
        // Use the template to format the response - single LLM call for all cases
        const responseContext = composeContext({
            state: {
                ...state,
                extractionResults: extractionResultsText,
                responseTime: extractResponse ? extractResponse.response_time : 0,
                status: status,
                originalMessage: message.content.text
            },
            template: extractResponseTemplate
        });
        
        const formattedResponse = await generateText({
            runtime,
            context: responseContext,
            modelClass: ModelClass.MEDIUM,
        });
        
        callback({
            text: formattedResponse
        });
    },
    examples: webExtractExamples
} as Action;