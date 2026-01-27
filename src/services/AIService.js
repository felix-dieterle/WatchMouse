import axios from 'axios';

/**
 * AI Service for filtering and matching search results using OpenRouter API
 */
export class AIService {
  constructor() {
    // OpenRouter API configuration
    // Users should set their API key in environment or config
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.model = 'openai/gpt-3.5-turbo'; // Using a cheaper model
  }

  /**
   * Filter search results to find matches using AI
   * @param {string} searchQuery - User's search query
   * @param {Array} results - Array of search results from platforms
   * @returns {Array} Filtered array of matching results
   */
  async filterMatches(searchQuery, results) {
    if (!this.apiKey) {
      console.warn('No OpenRouter API key configured. Returning all results.');
      // Fallback to simple keyword matching
      return this.fallbackFilter(searchQuery, results);
    }

    try {
      const prompt = this.buildFilterPrompt(searchQuery, results);
      const response = await this.callAI(prompt);
      return this.parseAIResponse(response, results);
    } catch (error) {
      console.error('AI filtering error:', error);
      // Fallback to simple matching
      return this.fallbackFilter(searchQuery, results);
    }
  }

  /**
   * Build a prompt for the AI to filter results
   */
  buildFilterPrompt(searchQuery, results) {
    const resultsText = results.map((r, idx) => 
      `${idx}: ${r.title} - €${r.price}`
    ).join('\n');

    return `You are helping to filter shopping results. The user is searching for: "${searchQuery}"

Here are the results to filter:
${resultsText}

Please identify which results match the search criteria. Consider:
- Typos and spelling variations
- Items that contain more features than requested (acceptable)
- Items must meet the minimum criteria of the search
- Price should be reasonable for the item type

Return only the indices (numbers) of matching results, separated by commas.
Example: 0,2,5

Indices of matching results:`;
  }

  /**
   * Call OpenRouter API
   */
  async callAI(prompt) {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/felix-dieterle/WatchMouse',
          'X-Title': 'WatchMouse',
        }
      }
    );

    // Validate response structure
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response structure');
    }

    return response.data.choices[0].message.content;
  }

  /**
   * Parse AI response to get matching indices
   */
  parseAIResponse(aiResponse, results) {
    try {
      // Extract numbers from the response
      const indices = aiResponse
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n) && n >= 0 && n < results.length);

      return indices.map(i => results[i]);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return [];
    }
  }

  /**
   * Fallback simple keyword matching when AI is not available
   */
  fallbackFilter(searchQuery, results) {
    const keywords = searchQuery.toLowerCase().split(' ');
    
    return results.filter(result => {
      const title = result.title.toLowerCase();
      // Check if at least 50% of keywords are present
      const matchCount = keywords.filter(keyword => 
        title.includes(keyword)
      ).length;
      
      return matchCount >= Math.ceil(keywords.length * 0.5);
    });
  }
}
