// Core rule-based risk evaluation for dishes.
// Designed so we can later swap in or augment with an LLM-based engine
// without changing UI components.

/**
 * Evaluate rule-based allergen risk for a single dish.
 *
 * @param {Object} dish - Dish object with at least { name, tags }.
 * @param {Set<string>} selectedAllergens - Set of allergen names.
 * @returns {{
 *   matchedAllergens: string[],
 *   hasRisk: boolean,
 *   meta: { source: "rules" }
 * }}
 */
export function evaluateDishRisk(dish, selectedAllergens) {
  const tags = Array.isArray(dish?.tags) ? dish.tags : [];
  const allergenSet =
    selectedAllergens instanceof Set
      ? selectedAllergens
      : new Set(selectedAllergens || []);

  const matchedAllergens = tags.filter((t) => allergenSet.has(t));
  const hasRisk = matchedAllergens.length > 0;

  return {
    matchedAllergens,
    hasRisk,
    meta: {
      source: "rules",
    },
  };
}

/**
 * Human-readable explanation of risk for a dish.
 * Mirrors the previous rule-based copy used in the AI panel.
 *
 * @param {Object} dish - Dish object with { name, tags } (tags optional).
 * @param {Set<string>} selectedAllergens - Set of allergen names.
 * @returns {string}
 */
export function generateRiskExplanation(dish, selectedAllergens) {
  const name = dish?.name;
  const tags = Array.isArray(dish?.tags) ? dish.tags : [];

  if (!name) {
    return `Tell me the dish name, and I’ll check allergen risks and suggest safer options.`;
  }

  const { matchedAllergens, hasRisk } = evaluateDishRisk(
    { name, tags },
    selectedAllergens
  );

  if (!hasRisk) {
    return `✅ Looks OK: "${name}" doesn’t match your selected allergens.
If you want, ask the server to confirm sauces/marinades to be safe.`;
  }

  return `⚠️ Potential risk for "${name}": matches ${matchedAllergens.join(", ")}.
Safer options:
• Ask for NO ${matchedAllergens.join(" / ")} (if possible)
• Request sauce on the side
• Choose a simpler dish (grilled meat + veggies)
Would you like a short message you can show the staff?`;
}

