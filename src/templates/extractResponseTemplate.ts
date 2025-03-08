/**
 * Template to format web content extraction response.
 * This template is used by the LLM to present extraction results
 * in a clear and readable way.
 */
export const extractResponseTemplate = `
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