export const searchParamsTemplate = `
Analyze the user's search query and extract the following parameters:
1. The number of results the user wants (default: 1)
2. The type of search (news or general, default: general)

Return a JSON object with these parameters:

Example response:
\`\`\`json
{
    "limit": 3,
    "type": "news"
}
\`\`\`

If the user doesn't specify a number of results, set "limit" to 1.
If the user doesn't specify a type, set "type" to "general".

Here are some examples of how to interpret user queries:
- "Find me 5 articles about AI" → limit: 5, type: "general"
- "What are the latest news about SpaceX?" → limit: 1, type: "news"
- "Give me multiple sources about climate change" → limit: 5, type: "general"
- "Find detailed information about quantum computing" → limit: 3, type: "general"
- "Show me recent developments in blockchain" → limit: 3, type: "news"

User query: {{message}}

Extract the search parameters from the query above. Respond with a JSON markdown block.
`; 