/**
 * Template to extract search query and options from user message.
 */
export const searchTemplate = `
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