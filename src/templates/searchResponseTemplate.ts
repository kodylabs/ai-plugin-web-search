/**
 * Template to translate and format search response
 */
export const searchResponseTemplate = `
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