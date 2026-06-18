const Groq = require('groq-sdk');
const logger = require('../observability/logger');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TRANSLATOR_PROMPT = `You are a query translator for a log search system.
Convert the user's natural language query into structured filter parameters.

Available fields:
- level: debug | info | warn | error | fatal (can be multiple)
- service: any string, exact match
- search: keywords to full-text search in the message
- time_range: relative time like "1h", "24h", "7d", "30m" or null for all time

Today's date context is provided. Always prefer relative time ranges.

Respond ONLY with JSON, no markdown:
{
  "levels": ["<level>", ...] or [],
  "service": "<service name>" or null,
  "search": "<keywords>" or null,
  "time_range": "<e.g. 1h, 24h, 7d>" or null,
  "interpretation": "<one sentence describing what you understood>"
}`;

const translateQuery = async (naturalLanguageQuery) => {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: TRANSLATOR_PROMPT },
        { role: 'user', content: naturalLanguageQuery },
      ],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content;
    const parsed = JSON.parse(raw);

    logger.debug('Query translated', {
      query: naturalLanguageQuery,
      result: parsed,
      tokens: response.usage?.total_tokens,
    });

    return { success: true, filters: parsed, tokens: response.usage?.total_tokens || 0 };
  } catch (err) {
    logger.error('Query translation failed', { error: err.message });
    return { success: false, filters: null, tokens: 0 };
  }
};


const resolveTimeRange = (timeRange) => {
  if (!timeRange) return null;

  const match = timeRange.match(/^(\d+)([mhd])$/);
  if (!match) return null;

  const [, amount, unit] = match;
  const ms = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }[unit];

  return new Date(Date.now() - parseInt(amount) * ms);
};

module.exports = { translateQuery, resolveTimeRange };