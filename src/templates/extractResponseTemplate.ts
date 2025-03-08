/**
 * Template to format web content extraction response.
 * This template is used by the LLM to present extraction results
 * in a clear and readable way.
 */
export const extractResponseTemplate = `
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