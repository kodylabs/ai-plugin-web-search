// src/actions/webSearch.ts
import {
  elizaLogger,
  composeContext,
  generateObjectDeprecated,
  ModelClass
} from "@elizaos/core";

// src/services/webSearchService.ts
import {
  Service,
  ServiceType
} from "@elizaos/core";
import { tavily } from "@tavily/core";
var WebSearchService = class _WebSearchService extends Service {
  tavilyClient;
  async initialize(_runtime) {
    const apiKey = _runtime.getSetting("TAVILY_API_KEY");
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY is not set");
    }
    this.tavilyClient = tavily({ apiKey });
  }
  getInstance() {
    return _WebSearchService.getInstance();
  }
  static get serviceType() {
    return ServiceType.WEB_SEARCH;
  }
  async search(query, options) {
    try {
      let maxResults = 1;
      if (options && options.limit !== void 0) {
        maxResults = typeof options.limit === "string" ? parseInt(options.limit, 10) : options.limit;
      }
      const tavilyOptions = {
        includeAnswer: (options == null ? void 0 : options.includeAnswer) ?? true,
        maxResults,
        topic: (options == null ? void 0 : options.type) || "general",
        searchDepth: (options == null ? void 0 : options.searchDepth) || "basic",
        includeImages: (options == null ? void 0 : options.includeImages) || false,
        days: (options == null ? void 0 : options.days) || 3
      };
      const response = await this.tavilyClient.search(query, tavilyOptions);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// src/templates/searchParamsTemplate.ts
var searchParamsTemplate = `
Analyze the following message and extract these parameters:
1. The number of results desired (default: 1)
2. The type of search (news or general, default: general)
3. A reformulated search query that will yield the best search results

Return a JSON object with these parameters:

Example response:
\`\`\`json
{
    "limit": 3,
    "type": "news",
    "query": "SpaceX recent rocket launches and achievements"
}
\`\`\`

If no number of results is specified, set "limit" to 1.
If no type is specified, set "type" to "general".
Always include a reformulated "query" that is clear, specific, and optimized for search engines.

IMPORTANT: Your reformulated query should:
- Stay faithful to the original request
- NOT add specific topics or technologies that weren't mentioned
- NOT assume specific use cases unless clearly stated
- Focus on the main subject of the query
- Be concise and clear

Here are some examples of how to interpret queries:
- "Find me 5 articles about AI" \u2192 limit: 5, type: "general", query: "artificial intelligence latest developments"
- "What are the latest news about SpaceX?" \u2192 limit: 1, type: "news", query: "SpaceX recent news"
- "Give me multiple sources about climate change" \u2192 limit: 5, type: "general", query: "climate change information"
- "Find detailed information about quantum computing" \u2192 limit: 3, type: "general", query: "quantum computing overview"
- "Show me recent developments in blockchain" \u2192 limit: 3, type: "news", query: "blockchain recent developments"
- "Can you look up information about Cursor?" \u2192 limit: 1, type: "general", query: "Cursor software information"

Message to analyze: {{message}}

Extract the search parameters from the message above. Reformulate the query for better search results. Respond with a JSON markdown block.
`;

// src/utils/searchUtils.ts
import { encodingForModel } from "js-tiktoken";
var DEFAULT_MAX_WEB_SEARCH_TOKENS = 4e3;
var DEFAULT_MODEL_ENCODING = "gpt-3.5-turbo";
function getTotalTokensFromString(str, encodingName = DEFAULT_MODEL_ENCODING) {
  const encoding = encodingForModel(encodingName);
  return encoding.encode(str).length;
}
function MaxTokens(data, maxTokens = DEFAULT_MAX_WEB_SEARCH_TOKENS) {
  if (getTotalTokensFromString(data) >= maxTokens) {
    return data.slice(0, maxTokens);
  }
  return data;
}
function isValidSearchParams(params) {
  if (typeof params !== "object" || params === null) {
    return false;
  }
  if ("limit" in params) {
    if (typeof params.limit === "string") {
      const parsedLimit = parseInt(params.limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return false;
      }
      params.limit = parsedLimit;
    } else if (typeof params.limit !== "number" || params.limit < 1 || !Number.isInteger(params.limit)) {
      return false;
    }
  }
  if ("type" in params) {
    if (typeof params.type !== "string" || params.type !== "news" && params.type !== "general") {
      return false;
    }
  }
  return true;
}

// src/examples/webSearchExamples.ts
var webSearchExamples = [
  [
    {
      user: "{{user1}}",
      content: {
        text: "Find the latest news about SpaceX launches."
      }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here is the latest news about SpaceX launches:",
        action: "WEB_SEARCH"
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: {
        text: "Can you find 3 details about the iPhone 16 release?"
      }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here are the details I found about the iPhone 16 release:",
        action: "WEB_SEARCH"
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: {
        text: "What is the schedule for the next FIFA World Cup?"
      }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here is the schedule for the next FIFA World Cup:",
        action: "WEB_SEARCH"
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: { text: "Check the latest stock price of Tesla." }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here is the latest stock price of Tesla I found:",
        action: "WEB_SEARCH"
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: {
        text: "Find 5 trending movies in the US."
      }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here are the current trending movies in the US:",
        action: "WEB_SEARCH"
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: {
        text: "What is the latest score in the NBA finals?"
      }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here is the latest score from the NBA finals:",
        action: "WEB_SEARCH"
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: { text: "When is the next Apple keynote event?" }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here is the information about the next Apple keynote event:",
        action: "WEB_SEARCH"
      }
    }
  ]
];

// src/actions/webSearch.ts
var webSearch = {
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
    "FIND_INFORMATION"
  ],
  suppressInitialMessage: true,
  description: "Perform a web search to find information related to the message.",
  validate: async (runtime) => {
    return !!runtime.getSetting("TAVILY_API_KEY");
  },
  handler: async (runtime, message, state, _options, callback) => {
    state = await runtime.composeState(message);
    const userId = runtime.agentId;
    elizaLogger.log("Original search query:", message.content.text);
    try {
      const recentMessagesData = state.recentMessagesData || [];
      const currentUserMessageIndex = recentMessagesData.findIndex((m) => m.content && m.content.text === message.content.text);
      let lastRelevantAgentMessage = null;
      if (currentUserMessageIndex >= 0 && currentUserMessageIndex < recentMessagesData.length - 1) {
        for (let i = currentUserMessageIndex + 1; i < recentMessagesData.length; i++) {
          const m = recentMessagesData[i];
          if (m.agentId === message.agentId) {
            lastRelevantAgentMessage = m;
            break;
          }
        }
      }
      const searchParamsContext = composeContext({
        state: {
          ...state,
          message: lastRelevantAgentMessage
        },
        template: searchParamsTemplate
      });
      const searchParams = await generateObjectDeprecated({
        runtime,
        context: searchParamsContext,
        modelClass: ModelClass.SMALL
      });
      const isParamsValid = isValidSearchParams(searchParams);
      if (!isParamsValid) {
        elizaLogger.warn("Invalid search parameters, using defaults");
      }
      const webSearchPrompt = searchParams.query;
      elizaLogger.log("Using reformulated search query:", webSearchPrompt);
      const webSearchService = new WebSearchService();
      await webSearchService.initialize(runtime);
      const searchOptions = isParamsValid ? {
        limit: typeof searchParams.limit === "string" ? parseInt(searchParams.limit, 10) : searchParams.limit,
        type: searchParams.type
      } : void 0;
      const searchResponse = await webSearchService.search(
        webSearchPrompt,
        searchOptions
      );
      if (searchResponse && searchResponse.results.length) {
        const limit = (searchOptions == null ? void 0 : searchOptions.limit) || 1;
        const limitedResults = searchResponse.results.slice(0, limit);
        const responseList = searchResponse.answer ? `${searchResponse.answer}${Array.isArray(limitedResults) && limitedResults.length > 0 ? `

For more details, you can check out these resources:
${limitedResults.map(
          (result, index) => `${index + 1}. [${result.title}](${result.url})`
        ).join("\n")}` : ""}` : "";
        callback({
          text: MaxTokens(responseList, DEFAULT_MAX_WEB_SEARCH_TOKENS)
        });
      } else {
        elizaLogger.error("Search failed or returned no data");
      }
    } catch (error) {
      elizaLogger.error("Error in web search handler:", error);
    }
  },
  examples: webSearchExamples
};

// src/actions/webExtract.ts
import {
  elizaLogger as elizaLogger2,
  composeContext as composeContext2,
  generateObject,
  generateText,
  ModelClass as ModelClass2
} from "@elizaos/core";

// src/templates/extractParamsTemplate.ts
var extractParamsTemplate = `
Analyze the following message and extract these parameters:
1. The URLs to extract content from (up to 20 URLs)
2. Whether to include images (default: false)
3. The extraction depth (basic or advanced, default: basic)

Return a JSON object with these parameters. The JSON MUST be valid and properly formatted.

Example response:
\`\`\`json
{
    "urls": [
        "https://en.wikipedia.org/wiki/Artificial_intelligence",
        "https://en.wikipedia.org/wiki/Machine_learning"
    ],
    "includeImages": true,
    "extractDepth": "advanced"
}
\`\`\`

IMPORTANT FORMATTING RULES:
- "includeImages" MUST be a boolean value (true or false without quotes), NOT a string
- "extractDepth" MUST be a string ("basic" or "advanced" with quotes)
- "urls" MUST be an array of strings, even if empty

If no image preference is specified, set "includeImages" to false (without quotes).
If no extraction depth is specified, set "extractDepth" to "basic" (with quotes).

IMPORTANT CONTENT RULES:
- Extract ALL URLs mentioned in the message
- URLs must be valid and complete (starting with http:// or https://)
- Maximum 20 URLs can be processed at once
- Do not add URLs that weren't mentioned
- If a URL is incomplete (e.g., "wikipedia.org/wiki/Python"), add the appropriate prefix (e.g., "https://en.wikipedia.org/wiki/Python")

Here are some examples of how to interpret queries:
- "Extract content from https://en.wikipedia.org/wiki/Artificial_intelligence" \u2192 {"urls": ["https://en.wikipedia.org/wiki/Artificial_intelligence"], "includeImages": false, "extractDepth": "basic"}
- "Get information from these pages: https://example.com and https://example.org with images" \u2192 {"urls": ["https://example.com", "https://example.org"], "includeImages": true, "extractDepth": "basic"}
- "Extract detailed content from https://docs.python.org/3/" \u2192 {"urls": ["https://docs.python.org/3/"], "includeImages": false, "extractDepth": "advanced"}

Message to analyze: {{message}}

Extract the URLs and options from the message above. Respond ONLY with a valid JSON object, nothing else.
`;

// src/templates/extractResponseTemplate.ts
var extractResponseTemplate = `
Question or request to answer:
{{message}}

Content available:
{{extractionResults}}

Status: {{status}}

Response rules:
1. If status is NOT "success":
   - "Unable to access requested information: [reason]"
   - No other explanation

2. If status is "no_results":
   - "No information found. Please verify the URL."
   - No suggestions or alternatives

3. If status is "success":
   a. Look for the exact information in the content
   b. If found:
      - State ONLY the facts found
      - One or two or three sentences maximum
      - No introductions like "I will..." or "One moment..."
      - No suggestions to check the original source
   c. If not found in the content:
      - "The specific information is not available in the content"
      - No alternatives or suggestions

4. Language:
   - Match the user's language exactly
   - Keep it factual and direct
   - Never repeat the agent's name or user name in the response

Remember: Just the facts, directly stated.`;

// src/examples/webExtractExamples.ts
var webExtractExamples = [
  [
    {
      user: "{{user1}}",
      content: {
        text: "What are the main features of the latest iPhone? Here's the page: https://www.apple.com/iphone/"
      }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here are the main features of the latest iPhone that I extracted from the page:",
        action: "WEB_EXTRACT"
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: {
        text: "I'm interested in the Tesla Model 3 specs. Can you look at this page and tell me about them? https://www.tesla.com/model3/specs"
      }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here are the technical specifications of the Tesla Model 3 that I extracted:",
        action: "WEB_EXTRACT"
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: {
        text: "I want to make this lasagna recipe. What ingredients do I need and what are the steps? https://www.allrecipes.com/recipe/24074/alysias-basic-meat-lasagna/"
      }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here are the ingredients and steps from the lasagna recipe that I extracted:",
        action: "WEB_EXTRACT"
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: {
        text: "I need to understand the main points of this scientific article for my research. Can you help? https://www.nature.com/articles/s41586-020-2649-2"
      }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here are the main conclusions from the scientific article that I extracted:",
        action: "WEB_EXTRACT"
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: {
        text: "I'm looking for events to attend this weekend. Can you check these sites and tell me what's happening? https://www.eventbrite.com/ and https://www.meetup.com/"
      }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here's the information about upcoming events that I extracted from both sites:",
        action: "WEB_EXTRACT"
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: {
        text: "I want to buy a PlayStation 5 but I'm not sure where to get it. Can you compare the prices on these sites? https://www.amazon.com/PlayStation-5-Console-CFI-1215A01X/dp/B0BCNKKZ91 and https://www.bestbuy.com/site/sony-playstation-5-console/6523167.p"
      }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here's a comparison of PlayStation 5 prices from the websites you provided:",
        action: "WEB_EXTRACT"
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: {
        text: "What's the weather going to be like in New York for the next few days? Check this link: https://weather.com/weather/tenday/l/New+York+NY"
      }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here's the weather forecast for New York that I extracted:",
        action: "WEB_EXTRACT"
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: {
        text: "I'm trying to decide which programming language to learn. Can you help me understand the differences between Python and Java by looking at their docs? https://docs.python.org/3/ and https://docs.oracle.com/en/java/"
      }
    },
    {
      user: "{{agentName}}",
      content: {
        text: "Here are the main differences between Python and Java based on their documentation:",
        action: "WEB_EXTRACT"
      }
    }
  ]
];

// src/services/webExtractService.ts
import {
  Service as Service2,
  ServiceType as ServiceType2
} from "@elizaos/core";
import { tavily as tavily2 } from "@tavily/core";
var WebExtractService = class _WebExtractService extends Service2 {
  tavilyClient;
  async initialize(_runtime) {
    const apiKey = _runtime.getSetting("TAVILY_API_KEY");
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY is not set");
    }
    this.tavilyClient = tavily2({ apiKey });
  }
  getInstance() {
    return _WebExtractService.getInstance();
  }
  static get serviceType() {
    return ServiceType2.WEB_SEARCH;
  }
  async extract(urls, options) {
    try {
      const tavilyOptions = {
        includeImages: (options == null ? void 0 : options.includeImages) || false
      };
      const tavilyResponse = await this.tavilyClient.extract(urls);
      const anyResponse = tavilyResponse;
      const successfulResults = (anyResponse.results || []).map((result) => ({
        url: result.url,
        raw_content: result.rawContent || result.content || "",
        images: result.images
      }));
      const failedResults = (anyResponse.failedResults || []).map((result) => ({
        url: result.url,
        error: result.error || "Unknown error"
      }));
      const response = {
        results: successfulResults,
        failed_results: failedResults,
        response_time: anyResponse.responseTime || 0
      };
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// src/types.ts
import { z } from "zod";
var ExtractParamsSchema = z.object({
  urls: z.array(z.string().url()),
  includeImages: z.boolean().optional(),
  extractDepth: z.enum(["basic", "advanced"]).optional()
});

// src/actions/webExtract.ts
var webExtract = {
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
    "URL_EXTRACT"
  ],
  suppressInitialMessage: true,
  description: "Perform a web urls information extraction",
  validate: async (runtime) => {
    return !!runtime.getSetting("TAVILY_API_KEY");
  },
  handler: async (runtime, message, state, _options, callback) => {
    state = await runtime.composeState(message);
    let extractResponse;
    let extractionResultsText = "";
    let status = "success";
    try {
      const extractParamsContext = composeContext2({
        state: {
          ...state,
          message: message.content.text
        },
        template: extractParamsTemplate
      });
      const extractParams = await generateObject({
        runtime,
        context: extractParamsContext,
        modelClass: ModelClass2.SMALL,
        schema: ExtractParamsSchema,
        schemaName: "ExtractParams",
        schemaDescription: "Parameters for web extraction including URLs and options"
      });
      const { urls, includeImages, extractDepth } = extractParams.object;
      const extractOptions = {
        includeImages: includeImages ?? false,
        extractDepth: extractDepth || "basic"
      };
      const webExtractService = new WebExtractService();
      await webExtractService.initialize(runtime);
      try {
        extractResponse = await webExtractService.extract(
          urls,
          extractOptions
        );
        if (extractResponse && extractResponse.results.length) {
          extractResponse.results.forEach((result, index) => {
            extractionResultsText += `URL: ${result.url}
`;
            extractionResultsText += `Content: ${result.raw_content}
`;
            if (result.images && result.images.length > 0) {
              extractionResultsText += `Images: ${result.images.length}
`;
            }
            extractionResultsText += "\n---\n\n";
          });
          if (extractResponse.failed_results && extractResponse.failed_results.length > 0) {
            extractionResultsText += "Failed URLs:\n";
            extractResponse.failed_results.forEach((result) => {
              extractionResultsText += `${result.url} - ${result.error}
`;
            });
          }
          status = "success";
        } else {
          extractionResultsText = "Could not extract content from the provided URLs. Please check that the URLs are accessible and try again.\n";
          status = "no_results";
        }
      } catch (error) {
        elizaLogger2.error("Error in web extract handler:", error);
        extractionResultsText = `An error occurred while extracting from URLs: ${error.message || "Unknown error"}
`;
        status = "error";
      }
    } catch (error) {
      elizaLogger2.error("Error in web extract handler:", error);
      extractionResultsText = `An error occurred while processing your request: ${error.message || "Unknown error"}`;
      status = "error";
    }
    const responseContext = composeContext2({
      state: {
        ...state,
        extractionResults: extractionResultsText,
        responseTime: extractResponse ? extractResponse.response_time : 0,
        status,
        message: message.content.text
      },
      template: extractResponseTemplate
    });
    const formattedResponse = await generateText({
      runtime,
      context: responseContext,
      modelClass: ModelClass2.MEDIUM
    });
    callback({
      text: formattedResponse
    });
  },
  examples: webExtractExamples
};

// src/index.ts
var webSearchPlugin = {
  name: "webSearch",
  description: "Search the web and get news",
  actions: [webSearch, webExtract]
};
export {
  webSearchPlugin
};
//# sourceMappingURL=index.js.map