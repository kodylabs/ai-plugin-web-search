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
  // eslint-disable-next-line
  validate: async (runtime) => {
    return !!runtime.getSetting("TAVILY_API_KEY");
  },
  handler: async (runtime, message, state, _options, callback) => {
    elizaLogger.log("Composing state for message:", message);
    state = await runtime.composeState(message);
    const userId = runtime.agentId;
    elizaLogger.log("User ID:", userId);
    elizaLogger.log("Original search query:", message.content.text);
    try {
      const recentMessagesData = state.recentMessagesData || [];
      const lastAgentMessage = recentMessagesData.filter((m) => m.agentId === message.agentId).pop();
      const lastAgentMessageText = lastAgentMessage.content.text;
      elizaLogger.log("Last agent message:", lastAgentMessageText);
      const searchParamsContext = composeContext({
        state: {
          ...state,
          message: lastAgentMessageText
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
      elizaLogger.log("Extracted search parameters:", searchParams);
      const webSearchPrompt = searchParams.query;
      elizaLogger.log("Using reformulated search query:", webSearchPrompt);
      const webSearchService = new WebSearchService();
      await webSearchService.initialize(runtime);
      const searchOptions = isParamsValid ? {
        limit: typeof searchParams.limit === "string" ? parseInt(searchParams.limit, 10) : searchParams.limit,
        type: searchParams.type
      } : void 0;
      elizaLogger.log("Search options:", searchOptions);
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

// src/index.ts
var webSearchPlugin = {
  name: "webSearch",
  description: "Search the web and get news",
  actions: [webSearch],
  evaluators: [],
  providers: [],
  services: [new WebSearchService()],
  clients: [],
  adapters: []
};
var index_default = webSearchPlugin;
export {
  index_default as default,
  webSearchPlugin
};
//# sourceMappingURL=index.js.map