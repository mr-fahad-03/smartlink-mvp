const { env } = require("../config/env");

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function detectIntentType(leadInput) {
  const explicitIntent = normalizeText(leadInput.metadata?.intent);
  if (explicitIntent === "do_it_for_me" || explicitIntent === "advice" || explicitIntent === "guided") {
    return explicitIntent;
  }

  const hintText = [
    leadInput.preferredSupportType,
    leadInput.primaryIssue,
    leadInput.metadata?.supportPreference,
    leadInput.metadata?.diagnosticGoal,
    leadInput.metadata?.notes,
  ]
    .filter(Boolean)
    .map((item) => normalizeText(item))
    .join(" ");

  if (
    hintText.includes("do it for me") ||
    hintText.includes("done-for-you") ||
    hintText.includes("someone to handle it") ||
    hintText.includes("full setup done for me") ||
    hintText.includes("handle it")
  ) {
    return "do_it_for_me";
  }

  if (
    hintText.includes("not sure") ||
    hintText.includes("guide me") ||
    hintText.includes("clear direction")
  ) {
    return "guided";
  }

  if (
    hintText.includes("advice") ||
    hintText.includes("guidance") ||
    hintText.includes("coaching") ||
    hintText.includes("quick answers")
  ) {
    return "advice";
  }

  return "guided";
}

function getBudgetStrength(budgetPreference) {
  const normalized = normalizeText(budgetPreference);
  if (normalized.includes("high ($500+)")) return "high";
  if (normalized.includes("medium ($150-$500)")) return "medium";
  if (normalized.includes("low ($0-$150)")) return "low";
  if (normalized.includes("free / just exploring")) return "exploring";
  return "unknown";
}

function isUrgent(urgencyPreference) {
  const normalized = normalizeText(urgencyPreference);
  return normalized.includes("right now") || normalized.includes("urgent");
}

function deriveLeadQualityAndPrice(leadInput) {
  const urgency = isUrgent(leadInput.urgencyPreference);
  const budgetStrength = getBudgetStrength(leadInput.budgetPreference);
  const intentType = detectIntentType(leadInput);
  const isDoItForMe = intentType === "do_it_for_me";
  const adviceFirst = intentType === "advice";
  const mediumOrHighBudget = budgetStrength === "medium" || budgetStrength === "high";

  let leadQualityTag = "low";
  if (urgency && (mediumOrHighBudget || isDoItForMe)) {
    leadQualityTag = "high";
  } else if (urgency || mediumOrHighBudget || isDoItForMe) {
    leadQualityTag = "medium";
  } else if (budgetStrength === "exploring" || adviceFirst) {
    leadQualityTag = "low";
  }

  const leadPriceUsd =
    leadQualityTag === "high"
      ? env.LEAD_PRICE_HIGH
      : leadQualityTag === "medium"
        ? env.LEAD_PRICE_MEDIUM
        : env.LEAD_PRICE_LOW;

  const pricingBand =
    leadQualityTag === "high"
      ? "$30-$75"
      : leadQualityTag === "medium"
        ? "$15-$25"
        : "$5-$10";

  return {
    intentType,
    leadQualityTag,
    leadPriceUsd,
    pricingBand,
  };
}

module.exports = {
  deriveLeadQualityAndPrice,
};
