const Groq = require("groq-sdk");
const logger = require("../observability/logger");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const ANALYZER_PROMPT = `You are a senior site reliability engineer analysing a cluster of repeated error logs.
Given the representative error message, service name, and occurrence count, explain:
1. What likely causes this error in plain English
2. A suggested first step to investigate

Be concise. No generic advice — be specific to the error shown.

Respond ONLY with JSON:
{
  "summary": "<1-2 sentences explaining what this error likely means>",
  "likely_cause": "<most probable root cause in 1 sentence>",
  "suggested_action": "<specific first investigation step, max 15 words>"
}`;

const analyzeCluster = async (cluster) => {
  try {
    const content = `Error: "${cluster.representative_message}"
Level: ${cluster.level}
Service: ${cluster.service || "unknown"}
Occurrences: ${cluster.occurrence_count}
First seen: ${cluster.first_seen}
Last seen: ${cluster.last_seen}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: ANALYZER_PROMPT },
        { role: "user", content },
      ],
      temperature: 0.2,
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content);
    return {
      success: true,
      ...parsed,
      tokens: response.usage?.total_tokens || 0,
    };
  } catch (err) {
    logger.error("Cluster analysis failed", { error: err.message });
    return { success: false };
  }
};

module.exports = { analyzeCluster };
