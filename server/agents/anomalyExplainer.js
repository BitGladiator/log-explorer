const Groq = require("groq-sdk");
const logger = require("../observability/logger");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const EXPLAINER_PROMPT = `You are a site reliability engineer interpreting a statistically detected log anomaly.
Given the anomaly type, metrics, and a few sample logs, explain what likely happened and suggest one investigation step.

Be specific and concise. No generic advice.

Respond ONLY with JSON:
{
  "explanation": "<1-2 sentences on what likely happened>",
  "suggested_action": "<one specific investigation step, max 15 words>"
}`;

const explainAnomaly = async (anomaly, sampleLogs = []) => {
  try {
    const content = `Anomaly type: ${anomaly.type}
Severity: ${anomaly.severity}
Description: ${anomaly.description}
Current value: ${anomaly.metricValue}
Baseline value: ${anomaly.baselineValue}

Sample logs from this window:
${
  sampleLogs
    .slice(0, 5)
    .map((l) => `[${l.level}] ${l.message}`)
    .join("\n") || "none available"
}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: EXPLAINER_PROMPT },
        { role: "user", content },
      ],
      temperature: 0.2,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content);
    return {
      success: true,
      ...parsed,
      tokens: response.usage?.total_tokens || 0,
    };
  } catch (err) {
    logger.error("Anomaly explanation failed", { error: err.message });
    return { success: false, explanation: null, suggested_action: null };
  }
};

module.exports = { explainAnomaly };
