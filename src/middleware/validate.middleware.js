export const validate =
  (schema) =>
  async (req, res, next) => {
    try {
      req.validatedBody =
        await schema.parseAsync(
          req.body
        );

      next();
    } catch (err) {
      return res.status(400).json({
        success: false,

        errors: err.errors,
      });
    }
  };