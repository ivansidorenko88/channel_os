const {
  upsertUser,
  markOnboardingCompleted
} = require("../repositories/userRepository");
const {
  getOnboardingProgress
} = require("../repositories/onboardingRepository");

async function getOnboardingData(from) {
  const user = await upsertUser(from);
  const progress = await getOnboardingProgress(user.id);

  return {
    user,
    progress,
    shouldShow:
      !user.onboardingCompleted &&
      progress.channelCount === 0 &&
      progress.draftCount === 0 &&
      progress.postCount === 0 &&
      progress.scheduledCount === 0
  };
}

async function completeOnboarding(from) {
  const user = await upsertUser(from);
  return markOnboardingCompleted(user.id, true);
}

module.exports = {
  getOnboardingData,
  completeOnboarding
};
