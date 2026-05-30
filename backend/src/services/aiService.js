const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';

// Cached system prompt — shared across all AI calls.
// cache_control marks this block for server-side caching once it reaches
// the minimum token threshold (~2048 for Sonnet 4.6). Kept here so the
// pattern is correct when the prompt grows during development.
const SYSTEM = [
  {
    type: 'text',
    text: `You are CivicAI, an intelligence assistant for VoiceUp — a civic accountability platform that helps citizens in Ghana report and track community issues. Your role is to analyze citizen-reported issues and generate clear, structured, actionable intelligence for government officials and the public.

Guidelines:
- Be neutral, factual, and concise.
- Prioritize citizen safety and community welfare in your analysis.
- Flag issues of high urgency clearly.
- When returning JSON, output only valid JSON with no markdown fences, no extra commentary.
- Categories map to: roads_transport, water_sanitation, electricity, healthcare, education, corruption, security, flooding, waste_management, public_infrastructure, other.
- Urgency levels: "high" (safety risk or affects basic services), "medium" (quality of life issue), "low" (improvement suggestion).`,
    cache_control: { type: 'ephemeral' },
  },
];

// Strip markdown code fences Claude sometimes wraps JSON in
const parseJSON = (text) => {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
};

const callClaude = (userContent, maxTokens = 512) =>
  client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: SYSTEM,
    messages: [{ role: 'user', content: userContent }],
  });

// ── 1. Report Summarization ────────────────────────────────────────────────

exports.summarizeReport = async (post) => {
  const location = [
    post.location?.address,
    post.location?.city,
    post.constituency,
  ].filter(Boolean).join(', ') || 'Location not specified';

  const msg = await callClaude(
    `Summarize this citizen report in 2-3 concise sentences for public display on a civic platform. Focus on: what the problem is, where it is, and why it matters to the community. Do not add labels or JSON — return only the summary text.

Title: ${post.title}
Category: ${post.category?.replace(/_/g, ' ')}
Location: ${location}
Status: ${post.status}
Report:
${post.description}`,
    300,
  );

  return msg.content[0].text.trim();
};

// ── 2. Issue Clustering ────────────────────────────────────────────────────

exports.clusterReports = async (posts) => {
  if (!posts.length) return [];

  const sample = posts.slice(0, 30);
  const reportList = sample
    .map((p, i) =>
      `[${i + 1}] ${p.title} | ${p.category?.replace(/_/g, ' ')} | ${p.location?.city || p.constituency || 'Unknown'}\n     ${p.description.slice(0, 180)}`
    )
    .join('\n\n');

  const msg = await callClaude(
    `Analyze these ${sample.length} citizen reports and identify clusters of related issues. Group reports that describe the same underlying problem, nearby incidents of the same type, or recurring patterns.

Return a JSON array of cluster objects. Every report must appear in exactly one cluster. Single-item clusters are fine for unique issues.

Schema for each cluster:
{
  "title": "short descriptive title",
  "postIndices": [1-based indices of reports in this cluster],
  "summary": "2-sentence description of the shared issue",
  "urgency": "high|medium|low",
  "dominantCategory": "category slug"
}

Reports:
${reportList}`,
    1200,
  );

  try {
    const clusters = parseJSON(msg.content[0].text);
    return clusters.map((cluster) => ({
      title:             cluster.title,
      summary:           cluster.summary,
      urgency:           cluster.urgency,
      dominantCategory:  cluster.dominantCategory,
      postIds: (cluster.postIndices || [])
        .map((i) => sample[i - 1]?._id)
        .filter(Boolean),
      postCount: (cluster.postIndices || []).length,
    }));
  } catch {
    return [];
  }
};

// ── 3. Geographic Trend Analysis ──────────────────────────────────────────

exports.analyzeTrends = async (constituency, reportStats, recentPosts) => {
  const categoryBreakdown = Object.entries(reportStats.byCategory || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([cat, count]) => `  ${cat.replace(/_/g, ' ')}: ${count}`)
    .join('\n');

  const topIssues = (recentPosts || [])
    .slice(0, 8)
    .map((p) => `  - ${p.title} (${p.upvotes?.length || 0} upvotes, ${p.status})`)
    .join('\n');

  const msg = await callClaude(
    `Analyze the following civic data for ${constituency} constituency and produce a geographic trend analysis.

REPORT STATISTICS:
  Total reports:    ${reportStats.total}
  Response rate:    ${reportStats.responseRate}%
  Resolution rate:  ${reportStats.resolutionRate}%
  Ignored issues:   ${reportStats.ignoredCount}
  By status:        ${JSON.stringify(reportStats.byStatus)}
  By category:
${categoryBreakdown}

TOP ISSUES (by upvotes):
${topIssues}

Return a JSON object with this exact structure:
{
  "hotspots": ["description of top problem areas or zones"],
  "recurringIssues": ["issues appearing repeatedly across reports"],
  "risingCategories": ["categories with high or growing complaint volume"],
  "ignoredAreasConcern": "brief note on ignored issues trend, or null if not significant",
  "keyInsights": ["3-5 data-driven civic insights for this constituency"],
  "overallUrgency": "high|medium|low"
}`,
    900,
  );

  try {
    return parseJSON(msg.content[0].text);
  } catch {
    return {
      keyInsights: ['Trend analysis temporarily unavailable.'],
      overallUrgency: 'medium',
    };
  }
};

// ── 4. MP Briefing Generation ─────────────────────────────────────────────

exports.generateMPBriefing = async (constituency, dashboardData) => {
  const { reportStats, projectStats, topIssues } = dashboardData;

  const topIssuesList = (topIssues || [])
    .slice(0, 5)
    .map((p, i) => `  ${i + 1}. ${p.title} — ${p.upvotes?.length || 0} upvotes, status: ${p.status}`)
    .join('\n');

  const projectBreakdown = Object.entries(projectStats.byStatus || {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
    .join(', ');

  const msg = await callClaude(
    `Generate a concise weekly constituency briefing for the Member of Parliament representing ${constituency}.

CONSTITUENCY DATA:
  Citizen reports:    ${reportStats.total} total
  Response rate:      ${reportStats.responseRate}%
  Resolution rate:    ${reportStats.resolutionRate}%
  Ignored issues:     ${reportStats.ignoredCount}
  Government projects: ${projectStats.total} total (${projectBreakdown})

TOP CITIZEN ISSUES (by community votes):
${topIssuesList || '  No issues reported yet.'}

Return a JSON object with this exact structure:
{
  "executiveSummary": "2-3 sentence overview of current constituency status",
  "topPriorities": [
    { "issue": "...", "urgency": "high|medium|low", "recommendedAction": "..." }
  ],
  "projectAlerts": ["any delayed or stalled projects needing attention, or empty array"],
  "citizenSentiment": "positive|neutral|negative|mixed",
  "sentimentReason": "one sentence explaining the sentiment score",
  "weeklyHighlights": ["2-3 notable trends or events this period"],
  "recommendedActions": ["3-5 specific, actionable steps for the MP"]
}`,
    1200,
  );

  try {
    return parseJSON(msg.content[0].text);
  } catch {
    return {
      executiveSummary: 'Briefing generation temporarily unavailable. Please try again.',
      topPriorities: [],
      projectAlerts: [],
      citizenSentiment: 'neutral',
      sentimentReason: 'Insufficient data.',
      weeklyHighlights: [],
      recommendedActions: ['Review pending citizen reports in your dashboard.'],
    };
  }
};
