// src/actions/webSearch.ts
import {
  elizaLogger,
  composeContext,
  generateObject,
  generateText,
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
      const tavilyOptions = {
        searchDepth: (options == null ? void 0 : options.searchDepth) || "basic",
        topic: (options == null ? void 0 : options.topic) || "general",
        days: (options == null ? void 0 : options.days) || 3,
        maxResults: (options == null ? void 0 : options.maxResults) || 1,
        includeImages: (options == null ? void 0 : options.includeImages) || false,
        includeImageDescriptions: (options == null ? void 0 : options.includeImageDescriptions) || false,
        includeAnswer: (options == null ? void 0 : options.includeAnswer) ?? true,
        includeRawContent: (options == null ? void 0 : options.includeRawContent) || false,
        includeDomains: options == null ? void 0 : options.includeDomains,
        excludeDomains: options == null ? void 0 : options.excludeDomains,
        maxTokens: options == null ? void 0 : options.maxTokens
      };
      const response = await this.tavilyClient.search(query, tavilyOptions);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// src/types.ts
import { z } from "zod";
var SearchParamsSchema = z.object({
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

// src/templates/searchTemplate.ts
var searchTemplate = `
Analyze the following message and extract:
1. The search query (convert it to a simple search query suitable for a search engine)
2. Optional parameters if specified:
   - searchDepth: "basic" or "advanced"
   - topic: "general" or "news"
   - maxResults: number between 1 and 20

CRITICAL JSON FORMATTING RULES:
1. Use ONLY ASCII characters
2. Use ONLY double quotes (") for strings
3. Numbers must be actual numbers (not strings)
4. All fields must be at the root level (no nesting)

QUERY FORMATTING RULES:
1. Remove any personal pronouns or pleasantries
2. Make it concise and search-engine friendly
3. Remove any special characters or formatting
4. Keep important keywords and context

Examples of query transformation:
- "Can you search for information about the iPhone please?" -> "iPhone latest information"
- "Find me news about Korian group" -> "Korian group latest news"

Example of VALID JSON structure:
\`\`\`json
{
    "query": "Korian group latest news",
    "maxResults": 4,
    "topic": "news",
    "includeAnswer": true
}
\`\`\`

Default values (do not include if using these):
* searchDepth: "basic"
* topic: "general"
* maxResults: 1
* includeAnswer: true

Message to analyze: {{message}}

Extract the search parameters from the message above. Respond ONLY with a valid JSON object, nothing else.`;

// src/templates/searchResponseTemplate.ts
var searchResponseTemplate = `
You will receive a JSON string containing a search response with:
- query: the search query used
- answer: main search result summary
- results: array of relevant sources with titles, URLs, and content
- options: search parameters used

TASK:
1. Parse and analyze the content:
   - Use the query to understand the search context
   - Extract key information from the answer
   - Review content from each result
   - Consider relevance scores and dates
   - Use search options to understand the scope

2. Create a comprehensive response:
   - Focus on answering the original query
   - Start with the most relevant information
   - Add important details from source content
   - Ensure technical accuracy
   - Remove any redundancy

3. Format requirements:
   - Write in the language of the user's message
   - Keep technical terms unchanged (code, URLs, version numbers)
   - Use clear, professional language
   - No introductory phrases or meta-commentary
   - Match the language level of the original query

OUTPUT FORMAT:
[Main content in user's message language, directly answering the query]

Sources :
[Numbered list of translated titles with original URLs]

Example of GOOD response:
Python 3.12 introduces significant performance improvements, including a 20% reduction in execution time and better memory management.

Sources :
1. [Python 3.12 Release Notes](https://docs.python.org/3.12/whatsnew)
2. [Performance Improvements in Python 3.12](https://example.com/article)

Example of BAD response:
I will talk to you about Python...
Here is what I found on the latest news...

User message: {{message}}
Search response: {{searchResponse}}

CRITICAL: Start directly with the content in user's message language, NO introductions or meta-commentary allowed.`;

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
    var _a;
    state = await runtime.composeState(message);
    const recentMessagesData = state.recentMessagesData || [];
    const lastAgentMessage = recentMessagesData[recentMessagesData.length - 1];
    const searchMessage = (_a = lastAgentMessage == null ? void 0 : lastAgentMessage.content) == null ? void 0 : _a.text;
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
        schema: SearchParamsSchema
      })).object;
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
          modelClass: ModelClass.SMALL
        });
        callback({
          text: MaxTokens(enhancedResponse, DEFAULT_MAX_WEB_SEARCH_TOKENS)
        });
      }
    } catch (error) {
      elizaLogger.error("Web search error:", error);
    }
  },
  examples: webSearchExamples
};

// src/actions/webExtract.ts
import {
  elizaLogger as elizaLogger2,
  composeContext as composeContext2,
  generateObjectDeprecated,
  generateText as generateText2,
  ModelClass as ModelClass2
} from "@elizaos/core";

// src/utils/extractUtils.ts
import { encodingForModel as encodingForModel2 } from "js-tiktoken";
function validateUrls(urls) {
  if (!urls || !Array.isArray(urls)) {
    return [];
  }
  return urls.filter((url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  });
}
function normalizeExtractParams(params) {
  const normalizedParams = {
    urls: []
  };
  if (typeof params.includeImages === "string") {
    const lowerValue = String(params.includeImages).toLowerCase();
    normalizedParams.includeImages = lowerValue === "true";
  } else if (typeof params.includeImages === "boolean") {
    normalizedParams.includeImages = params.includeImages;
  } else {
    normalizedParams.includeImages = false;
  }
  if (typeof params.extractDepth === "string") {
    const lowerValue = params.extractDepth.toLowerCase();
    if (lowerValue === "basic" || lowerValue === "advanced") {
      normalizedParams.extractDepth = lowerValue;
    } else {
      normalizedParams.extractDepth = "basic";
    }
  } else {
    normalizedParams.extractDepth = "basic";
  }
  if (Array.isArray(params.urls)) {
    normalizedParams.urls = params.urls;
  }
  return normalizedParams;
}

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
Format web content extraction results in a clear and readable way.

Original user message:
{{message}}

Here are the extraction results to format:
{{extractionResults}}

Status: {{status}}

Formatting rules:
1. If status is "error" or "no_results", simply report the error message or explain why no results were found. Do not try to summarize non-existent content.
2. If status is "success", then:
   a. Present a concise summary of the content of each URL
   b. Organize information in a structured and easy-to-read way
   c. Highlight key points of the content
   d. If images were found, mention it
   e. If some URLs could not be extracted, explain why
3. Use a professional and informative tone
4. Respond in the same language as the original user message. If the original message is in French, respond in French. If it's in English, respond in English, etc.
5. Format the response in a clean, modern way that works well in messaging platforms like Discord or Slack
6. DO NOT include the status in your output
7. Use markdown formatting to make the content more readable (bold for titles, bullet points for lists, etc.)

Respond with the formatted content, without adding an introduction or conclusion.
`;

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
      const extractParams = await generateObjectDeprecated({
        runtime,
        context: extractParamsContext,
        modelClass: ModelClass2.SMALL
      });
      const normalizedParams = normalizeExtractParams(extractParams || {});
      const validUrls = validateUrls(normalizedParams.urls);
      if (validUrls.length === 0) {
        extractionResultsText = "No valid URLs were found in the message. Please provide valid URLs starting with http:// or https://.\n";
        status = "no_results";
      } else {
        const webExtractService = new WebExtractService();
        await webExtractService.initialize(runtime);
        const extractOptions = {
          includeImages: normalizedParams.includeImages !== void 0 ? normalizedParams.includeImages : false,
          extractDepth: normalizedParams.extractDepth || "basic"
        };
        try {
          extractResponse = await webExtractService.extract(validUrls, extractOptions);
          if (extractResponse && extractResponse.results.length) {
            extractResponse.results.forEach((result, index) => {
              extractionResultsText += `URL ${index + 1}: ${result.url}
`;
              extractionResultsText += `Content: ${result.raw_content}
`;
              if (result.images && result.images.length > 0) {
                extractionResultsText += `Images: ${result.images.length} image(s) found
`;
              }
              extractionResultsText += "\n---\n\n";
            });
            if (extractResponse.failed_results && extractResponse.failed_results.length > 0) {
              extractionResultsText += "URLs not extracted:\n";
              extractResponse.failed_results.forEach((result, index) => {
                extractionResultsText += `URL ${index + 1}: ${result.url} - Error: ${result.error}
`;
              });
              extractionResultsText += "\n---\n\n";
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
        originalMessage: message.content.text
      },
      template: extractResponseTemplate
    });
    const formattedResponse = await generateText2({
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