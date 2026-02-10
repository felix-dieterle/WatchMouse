# OpenRouter Model Selection Guide for WatchMouse

## Overview

WatchMouse uses AI to filter search results and match them against your saved queries. This guide helps you choose the best OpenRouter model for your needs, balancing cost and performance.

## WatchMouse AI Use Case

The AI in WatchMouse performs a **simple classification task**:
- **Input**: A search query (e.g., "iPhone 13") and a list of item titles with prices
- **Output**: Indices of items that match the search criteria
- **Requirements**: 
  - Understand typos and spelling variations
  - Recognize items with extra features as acceptable matches
  - Validate that items meet minimum search criteria
  - Return structured output (comma-separated numbers)

**Key characteristics:**
- Simple task (classification, not complex reasoning)
- Short responses (max 100 tokens - just a list of numbers)
- Cost-sensitive (runs on every search you execute)
- Low temperature (0.3) for consistent results

This is a **perfect use case for free or cheap models** - you don't need GPT-4's advanced reasoning!

## Recommended Models

### Free Models (Best Value) ✅

These models are **completely free** and work well for WatchMouse:

#### 1. **Meta: Llama 3.2 3B Instruct (Free)** ⭐ BEST FREE OPTION
- **Model ID**: `meta-llama/llama-3.2-3b-instruct:free`
- **Cost**: $0 (free!)
- **Why it's great**: Fast, reliable, and perfect for simple classification tasks like WatchMouse
- **Performance**: Excellent for matching product titles to queries
- **Recommendation**: **Start here!** This is likely all you need.

#### 2. **Google: Gemini Flash 1.5 (Free)**
- **Model ID**: `google/gemini-flash-1.5:free`
- **Cost**: $0 (free!)
- **Why it's great**: Very fast, good at understanding context
- **Performance**: Excellent for text matching and classification

#### 3. **Microsoft: Phi-3 Mini (Free)**
- **Model ID**: `microsoft/phi-3-mini-128k-instruct:free`
- **Cost**: $0 (free!)
- **Why it's great**: Small but capable, optimized for efficiency
- **Performance**: Good for straightforward matching tasks

#### 4. **Mistral: 7B Instruct (Free)**
- **Model ID**: `mistralai/mistral-7b-instruct:free`
- **Cost**: $0 (free!)
- **Why it's great**: Open-source favorite, reliable performance
- **Performance**: Good for text understanding and classification

### Cheap Models (Excellent Performance)

If you want the absolute best performance for a tiny cost:

#### 1. **OpenAI: GPT-3.5 Turbo** 💰 CURRENT DEFAULT
- **Model ID**: `openai/gpt-3.5-turbo`
- **Cost**: ~$0.0005 per 1K tokens (~$0.0001 per search)
- **Why it's great**: Industry standard, extremely reliable
- **Performance**: Excellent accuracy, handles typos and variations perfectly
- **Cost estimate**: ~100 searches = $0.01 (1 cent)

#### 2. **Meta: Llama 3.1 8B Instruct**
- **Model ID**: `meta-llama/llama-3.1-8b-instruct`
- **Cost**: ~$0.00006 per 1K tokens (~$0.00001 per search)
- **Why it's great**: 10x cheaper than GPT-3.5, excellent quality
- **Performance**: Nearly as good as GPT-3.5 for this task
- **Cost estimate**: ~1,000 searches = $0.01 (1 cent)

#### 3. **Google: Gemini Flash 1.5**
- **Model ID**: `google/gemini-flash-1.5`
- **Cost**: ~$0.000075 per 1K tokens (~$0.00002 per search)
- **Why it's great**: Fast and cheap, good balance
- **Performance**: Very good for text matching

### NOT Recommended (Overkill)

These models are too expensive for WatchMouse's simple use case:

❌ **GPT-4** series - 20-60x more expensive, unnecessary for simple matching  
❌ **Claude 3 Opus** - Premium model, way too expensive for this task  
❌ **Gemini Pro 1.5** - Overkill for simple classification  

## How to Change Models

### In Code (Developer)

Edit `src/constants/index.js`:

```javascript
export const API_CONFIG = {
  OPENROUTER: {
    BASE_URL: 'https://openrouter.ai/api/v1',
    MODEL: 'meta-llama/llama-3.2-3b-instruct:free', // Change this line
    MAX_TOKENS: 100,
    TEMPERATURE: 0.3,
  },
  // ...
};
```

### Future: In-App Model Selection

A future update will add model selection to the Settings screen, allowing you to choose from:
- Free models (no cost)
- Cheap models (best performance per dollar)
- Premium models (maximum accuracy)

## Cost Comparison Examples

Assuming 10 item results per search, average 100 tokens used:

| Model | Cost per Search | 100 Searches | 1,000 Searches |
|-------|----------------|--------------|----------------|
| **Llama 3.2 3B (Free)** | $0.00 | $0.00 | $0.00 |
| **Gemini Flash (Free)** | $0.00 | $0.00 | $0.00 |
| **Llama 3.1 8B** | ~$0.00001 | ~$0.001 | ~$0.01 |
| **GPT-3.5 Turbo** | ~$0.0001 | ~$0.01 | ~$0.10 |
| **GPT-4 Mini** | ~$0.0003 | ~$0.03 | ~$0.30 |
| **GPT-4** | ~$0.003 | ~$0.30 | ~$3.00 |

**Recommendation**: Start with a free model. You can always upgrade later if you want higher accuracy.

## Finding More Models

Browse all available models at:
- **Free models**: https://openrouter.ai/collections/free-models
- **All models**: https://openrouter.ai/models
- **Extended thinking**: https://openrouter.ai/collections/extended-thinking (NOT needed for WatchMouse)

Filter by:
- **Free** - No cost to use
- **Context length** - WatchMouse needs ~500-2000 tokens (most models support this)
- **Price** - Sort by cheapest first

## Testing Your Model Choice

After changing the model:

1. **Test with a search**: Create a search like "iPhone 13" and run it
2. **Check the results**: Do the matches make sense?
3. **Try edge cases**: Test with typos ("iPhne 13"), variations ("iPhone thirteen")
4. **Compare**: Try running the same search with different models

If a free model works well (and it probably will!), there's no need to pay for a premium model.

## Performance Tips

To reduce API costs even further:

1. **Use the fallback**: Without an API key, WatchMouse uses keyword matching (free but less accurate)
2. **Pre-filtering**: WatchMouse automatically pre-filters with keyword matching before AI (reduces API calls)
3. **Be specific**: More specific searches = fewer items to filter = lower costs
4. **Batch searches**: The app intelligently batches searches to minimize API calls

## Troubleshooting

### Model Returns No Results
- The model might not understand the output format
- **Solution**: Switch to GPT-3.5-turbo or Llama 3.2 3B (both very reliable)

### Model Returns Wrong Indices
- The model might be hallucinating or not following instructions
- **Solution**: Try a more reliable model (GPT-3.5-turbo, Gemini Flash)

### API Errors
- The model might be temporarily unavailable
- **Solution**: Check OpenRouter status, try a different model

### Costs Too High
- You might be using an expensive model
- **Solution**: Switch to a free model! (Llama 3.2 3B is excellent)

## Summary

**Quick Recommendations:**

- 🆓 **Best Free**: `meta-llama/llama-3.2-3b-instruct:free` - Start here!
- 💰 **Best Value**: `meta-llama/llama-3.1-8b-instruct` - 10x cheaper than GPT-3.5
- ⚡ **Current Default**: `openai/gpt-3.5-turbo` - Reliable but costs ~$0.10 per 1,000 searches
- ❌ **Avoid**: GPT-4 series - Too expensive for this simple task

**Bottom line**: WatchMouse's AI task is simple. **Use a free model** and save your money! The free models work great for matching product titles to search queries.
