const Post    = require('../models/Post');
const Project = require('../models/Project');
const User    = require('../models/User');

// ── helpers ──────────────────────────────────────────────────────────────────

const pct = (numerator, denominator) =>
  denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 10;

// ── controllers ──────────────────────────────────────────────────────────────

exports.getConstituencyDashboard = async (req, res) => {
  const { constituency } = req.params;

  const [
    reportAgg,
    projectAgg,
    mp,
    topIssues,
    recentReports,
    recentProjects,
  ] = await Promise.all([

    // ── report stats via aggregation ────────────────────────────────────────
    Post.aggregate([
      { $match: { constituency } },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          byCategory: [
            { $group: { _id: '$category', count: { $sum: 1 } } },
          ],
          total: [
            { $count: 'n' },
          ],
        },
      },
    ]),

    // ── project stats via aggregation ───────────────────────────────────────
    Project.aggregate([
      { $match: { constituency } },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          total: [
            { $count: 'n' },
          ],
        },
      },
    ]),

    // ── MP user for this constituency ────────────────────────────────────────
    User.findOne({ role: 'mp', constituency }).select(
      'firstName lastName email organization constituency'
    ),

    // ── top 5 unresolved issues by upvote count ──────────────────────────────
    Post.find({ constituency, status: { $nin: ['resolved', 'rejected'] } })
      .sort({ 'upvotes.length': -1 })
      .limit(5)
      .select('title category status upvotes downvotes createdAt constituency')
      .populate('author', 'firstName lastName'),

    // ── 5 most recent reports ────────────────────────────────────────────────
    Post.find({ constituency })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category status upvotes createdAt')
      .populate('author', 'firstName lastName'),

    // ── 5 most recent projects ───────────────────────────────────────────────
    Project.find({ constituency })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category status budget startDate expectedEndDate createdAt')
      .populate('author', 'firstName lastName'),
  ]);

  // ── shape report stats ────────────────────────────────────────────────────
  const rFacet      = reportAgg[0];
  const reportTotal = rFacet.total[0]?.n ?? 0;

  const byStatus = Object.fromEntries(
    ['pending', 'under_review', 'resolved', 'rejected', 'ignored'].map((s) => [s, 0])
  );
  rFacet.byStatus.forEach(({ _id, count }) => { byStatus[_id] = count; });

  const byCategory = {};
  rFacet.byCategory.forEach(({ _id, count }) => { byCategory[_id] = count; });

  // "Responded" = any status other than pending (MP/office took some action)
  // "Ignored"   = explicitly marked ignored (no meaningful response)
  const responded     = byStatus.under_review + byStatus.resolved + byStatus.rejected;
  const responseRate  = pct(responded, reportTotal);
  const resolutionRate = pct(byStatus.resolved, reportTotal);

  // ── shape project stats ───────────────────────────────────────────────────
  const pFacet       = projectAgg[0];
  const projectTotal = pFacet.total[0]?.n ?? 0;

  const byProjectStatus = Object.fromEntries(
    ['budgeted', 'in_progress', 'completed', 'delayed', 'budget_heavy', 'under_review'].map((s) => [s, 0])
  );
  pFacet.byStatus.forEach(({ _id, count }) => { byProjectStatus[_id] = count; });

  const completionRate = pct(byProjectStatus.completed, projectTotal);

  // ── sort topIssues by actual array length (aggregation can't sort on array size easily) ──
  topIssues.sort((a, b) => b.upvotes.length - a.upvotes.length);

  res.json({
    constituency,
    mp: mp ?? null,
    reportStats: {
      total:          reportTotal,
      byStatus,
      byCategory,
      responseRate,
      resolutionRate,
      ignoredCount:   byStatus.ignored,
    },
    projectStats: {
      total:          projectTotal,
      byStatus:       byProjectStatus,
      completionRate,
    },
    topIssues,
    recentReports,
    recentProjects,
  });
};

exports.getConstituencyReportStats = async (req, res) => {
  const { constituency } = req.params;
  const { from, to } = req.query;

  const match = { constituency };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to)   match.createdAt.$lte = new Date(to);
  }

  const [agg, total] = await Promise.all([
    Post.aggregate([
      { $match: match },
      {
        $facet: {
          byStatus:   [{ $group: { _id: '$status',   count: { $sum: 1 } } }],
          byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
          byMonth: [
            {
              $group: {
                _id:   { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
          ],
        },
      },
    ]),
    Post.countDocuments(match),
  ]);

  const facet = agg[0];

  const byStatus = Object.fromEntries(
    ['pending', 'under_review', 'resolved', 'rejected', 'ignored'].map((s) => [s, 0])
  );
  facet.byStatus.forEach(({ _id, count }) => { byStatus[_id] = count; });

  const byCategory = {};
  facet.byCategory.forEach(({ _id, count }) => { byCategory[_id] = count; });

  const responded      = byStatus.under_review + byStatus.resolved + byStatus.rejected;
  const responseRate   = pct(responded, total);
  const resolutionRate = pct(byStatus.resolved, total);

  res.json({
    constituency,
    total,
    byStatus,
    byCategory,
    byMonth:        facet.byMonth,
    responseRate,
    resolutionRate,
    ignoredCount:   byStatus.ignored,
  });
};
