import express from "express";
import Feedback from "../../models/Feedback.js";

const router = express.Router();

// protect + adminOnly already applied centrally in routes/admin/index.js

// ── GET /api/admin/feedback — paginated list with averages ─────────────────
router.get("/", async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Feedback.countDocuments(filter);

    const feedback = await Feedback.find(filter)
      .populate("user", "name email")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const avgByType = await Feedback.aggregate([
      {
        $group: {
          _id: "$type",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.max(1, Math.ceil(total / Number(limit))),
      feedback,
      averages: avgByType.reduce((acc, a) => {
        acc[a._id] = {
          avgRating: Math.round(a.avgRating * 10) / 10,
          count: a.count,
        };
        return acc;
      }, {}),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
