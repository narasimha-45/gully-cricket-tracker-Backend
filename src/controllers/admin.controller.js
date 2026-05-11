import { rebuildAnalytics } from "../services/reprocessing/rebuildAnalytics.service.js";

/* ======================================================
   REBUILD ANALYTICS
====================================================== */

export const rebuildAllAnalytics = async (req, res) => {
  try {
    const result = await rebuildAnalytics();

    return res.json({
      success: true,

      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,

      message: err.message,
    });
  }
};
