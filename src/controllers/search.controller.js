import * as searchService from "../services/search/search.service.js";

export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    const data = await searchService.globalSearch(q);

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
