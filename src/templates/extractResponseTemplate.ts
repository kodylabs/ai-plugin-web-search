/**
 * Template to format web content extraction response.
 * This template is used by the LLM to present extraction results
 * in a clear and readable way.
 */
export const extractResponseTemplate = `
User question or request:
{{message}}

Content available:
{{extractionResults}}

Status: {{status}}

Response rules:
1. If status is "error":
   - Explain what went wrong in a helpful way
   - If possible, suggest what might fix the issue
   - Format: "Sorry, I couldn't access the content: [reason]. [suggestion if possible]"

2. If status is "no_results":
   - Check if the URL seems valid
   - If URL looks invalid, suggest checking the format
   - If URL looks valid, suggest it might be temporarily inaccessible
   - Format: "I couldn't find the information. [reason and suggestion]"

3. If status is "success":
   a. Focus on answering the specific user question or request:
      - Carefully read the user's question/request
      - Look ONLY for information that directly answers it
      - Ignore irrelevant content even if interesting
      - Don't include full page content or unnecessary details

   b. When relevant information is found:
      - Answer the question directly and precisely
      - Include ONLY facts that relate to the question
      - Use bullet points if multiple relevant facts
      - Keep technical details only if specifically asked
      - Format: Direct answer to the question, nothing more

   c. If the specific answer isn't found:
      - Only mention relevant related information
      - Explain specifically what part of the question couldn't be answered
      - Format: "Regarding [specific question], I found [relevant facts only]. However, [specific missing detail] isn't mentioned."

4. Language:
   - Match the language of the user's message
   - Keep technical terms in their original language
   - Be direct but friendly
   - Use clear, simple language

Remember: Answer ONLY what was asked, be precise and concise.`; 