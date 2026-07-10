const { isExpiredCallbackError } = require("../utils/safeCallback");

async function callbackSafety(ctx, next) {
  if (!ctx.callbackQuery || typeof ctx.answerCbQuery !== "function") {
    return next();
  }

  const originalAnswer = ctx.answerCbQuery.bind(ctx);

  ctx.answerCbQuery = async (...args) => {
    try {
      return await originalAnswer(...args);
    } catch (error) {
      if (isExpiredCallbackError(error)) {
        console.warn(
          `[Callback] Ignored expired callback and continued action: ${ctx.callbackQuery.id}`
        );
        return false;
      }

      throw error;
    }
  };

  return next();
}

module.exports = { callbackSafety };
