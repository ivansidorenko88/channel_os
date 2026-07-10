function isExpiredCallbackError(error) {
  const description =
    error?.response?.description ||
    error?.description ||
    error?.message ||
    "";

  return (
    error?.response?.error_code === 400 &&
    (
      description.includes("query is too old") ||
      description.includes("query ID is invalid") ||
      description.includes("response timeout expired")
    )
  );
}

async function safeAnswerCbQuery(ctx, text, extra) {
  if (!ctx?.callbackQuery) {
    return false;
  }

  try {
    await ctx.answerCbQuery(text, extra);
    return true;
  } catch (error) {
    if (isExpiredCallbackError(error)) {
      console.warn(
        `[Callback] Ignored expired callback query: ${ctx.callbackQuery.id}`
      );
      return false;
    }

    throw error;
  }
}

module.exports = {
  safeAnswerCbQuery,
  isExpiredCallbackError
};
