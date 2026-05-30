const Post    = require('../models/Post');
const Project = require('../models/Project');
const User    = require('../models/User');
const ai      = require('../services/aiService');

const SUMMARY_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── helpers ──────────────────────────────────────────────────────────────────

const isSummaryStale = (post) =>
  !post.aiSummary ||
  !post.aiSummaryAt ||
  Date.now() - post.aiSummaryAt.getTime() > SUMMARY_TTL_MS;

const buildDashboardSnapshot = async (constituency) => {
  const [reportAgg, projectAgg, topIssues] = await Promise.all([
    Post.aggregate([
      { $match: { constituency } },
      {
        $facet: {
          byStatus:   [{ $group: { _id: '$status',   count: { $sum: 1 } } }],
          byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
          total:      [{ $count: 'n' }],
        },
      },
    ]),
    Project.aggregate([
      { $match: { constituency } },
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          total:    [{ $count: 'n' }],
        },
      },
    ]),
    Post.find({ constituency, status: { $nin: ['resolved', 'rejected'] } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title category status upvotes downvotes createdAt'),
  ]);

  const rFacet      = reportAgg[0];
  const reportTotal = rFacet.total[0]?.n ?? 0;

  const byStatus = Object.fromEntries(
    ['pending', 'under_review', 'resolved', 'rejected', 'ignored'].map((s) => [s, 0])
  );
  rFacet.byStatus.forEach(({ _id, count }) => { byStatus[_id] = count; });

  const byCategory = {};
  rFacet.byCategory.forEach(({ _id, count }) => { byCategory[_id] = count; });

  const responded      = byStatus.under_review + byStatus.resolved + byStatus.rejected;
  const pct = (n, d) => d === 0 ? 0 : Math.round((n / d) * 1000) / 10;

  const pFacet       = projectAgg[0];
  const projectTotal = pFacet.total[0]?.n ?? 0;
  const byProjectStatus = Object.fromEntries(
    ['budgeted', 'in_progress', 'completed', 'delayed', 'budget_heavy', 'under_review'].map((s) => [s, 0])
  );
  pFacet.byStatus.forEach(({ _id, count }) => { byProjectStatus[_id] = count; });

  topIssues.sort((a, b) => b.upvotes.length - a.upvotes.length);

  return {
    reportStats: {
      total:          reportTotal,
      byStatus,
      byCategory,
      responseRate:   pct(responded, reportTotal),
      resolutionRate: pct(byStatus.resolved, reportTotal),
      ignoredCount:   byStatus.ignored,
    },
    projectStats: {
      total:    projectTotal,
      byStatus: byProjectStatus,
    },
    topIssues,
  };
};

// ── controllers ──────────────────────────────────────────────────────────────

// GET /api/ai/summarize/:postId
exports.getSummary = async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: 'Report not found.' });

  if (!isSummaryStale(post)) {
    return res.json({ summary: post.aiSummary, cached: true });
  }

  const summary = await ai.summarizeReport(post);

  post.aiSummary   = summary;
  post.aiSummaryAt = new Date();
  await post.save();

  res.json({ summary, cached: false });
};

// GET /api/ai/cluster/:constituency
exports.clusterReports = async (req, res) => {
  const { constituency } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 30, 50);

  const posts = await Post.find({ constituency })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('title description category location constituency upvotes status');

  if (!posts.length)
    return res.json({ clusters: [], message: 'No reports found for this constituency.' });

  const clusters = await ai.clusterReports(posts);
  res.json({ clusters, reportCount: posts.length });
};

// GET /api/ai/trends/:constituency
exports.getTrends = async (req, res) => {
  const { constituency } = req.params;
  const snapshot = await buildDashboardSnapshot(constituency);

  const trends = await ai.analyzeTrends(
    constituency,
    snapshot.reportStats,
    snapshot.topIssues,
  );

  res.json({ constituency, trends, generatedAt: new Date() });
};

// GET /api/ai/briefing/:constituency  (mp / admin / super_admin only)
exports.getMPBriefing = async (req, res) => {
  const { constituency } = req.params;
  const snapshot = await buildDashboardSnapshot(constituency);

  const mp = await User.findOne({ role: 'mp', constituency })
    .select('firstName lastName');

  const briefing = await ai.generateMPBriefing(constituency, snapshot);

  res.json({
    constituency,
    mp:          mp ? `${mp.firstName} ${mp.lastName}` : null,
    briefing,
    generatedAt: new Date(),
  });
};
