/**
 * Analyzes a dish for potential hidden allergens using LLM reasoning.
 * Returns structured analysis with uncertainty language (never "safe").
 */
export async function analyzeDishWithLLM(dish, selectedAllergens) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { name, tags, note } = dish;
  const allergensArray = Array.from(selectedAllergens);
  const dishText = `${name}. ${note || ""}`.trim();

  // Rule-based matched allergens (already known)
  const matchedAllergens = tags.filter((t) => selectedAllergens.has(t));

  // LLM-style analysis for potential hidden allergens
  // This simulates what an LLM would analyze from the dish description
  const potentialAllergens = [];
  const evidence = [];
  let rationale = "";
  let confidence = "Medium";
  const verification = [];

  // Analyze dish name and description for hidden risks
  const lowerName = name.toLowerCase();
  const lowerNote = (note || "").toLowerCase();

  // Check for common hidden allergen patterns
  if (
    (lowerName.includes("salad") || lowerNote.includes("salad")) &&
    !matchedAllergens.includes("Egg") &&
    !matchedAllergens.includes("Milk")
  ) {
    potentialAllergens.push("Egg");
    evidence.push(`"${name}" - salads often contain mayo or creamy dressings`);
    rationale +=
      "Salads may contain mayonnaise (egg) or creamy dressings (dairy) not listed in tags. ";
  }

  if (
    (lowerName.includes("pad thai") || lowerNote.includes("peanut")) &&
    !matchedAllergens.includes("Peanuts")
  ) {
    potentialAllergens.push("Peanuts");
    evidence.push(`"${note || name}" - Thai dishes commonly use peanut-based sauces`);
    rationale +=
      "Thai dishes may contain peanut oil or ground peanuts in sauces even if not explicitly listed. ";
  }

  if (
    (lowerName.includes("pizza") || lowerName.includes("pasta")) &&
    !matchedAllergens.includes("Wheat")
  ) {
    potentialAllergens.push("Wheat");
    evidence.push(`"${name}" - pizza/pasta typically contains wheat flour`);
    rationale +=
      "Pizza and pasta dishes typically contain wheat flour in crusts or noodles. ";
  }

  if (
    (lowerName.includes("taco") || lowerName.includes("tortilla")) &&
    !matchedAllergens.includes("Wheat")
  ) {
    potentialAllergens.push("Wheat");
    evidence.push(`"${name}" - tortillas may contain wheat flour`);
    rationale +=
      "Tortillas may contain wheat flour unless specifically marked as corn-only. ";
  }

  if (
    (lowerName.includes("sauce") || lowerNote.includes("sauce")) &&
    !matchedAllergens.includes("Soy")
  ) {
    potentialAllergens.push("Soy");
    evidence.push(`"${note || name}" - sauces often contain soy-based ingredients`);
    rationale +=
      "Sauces and marinades may contain soy sauce, soy lecithin, or other soy derivatives. ";
  }

  if (
    (lowerName.includes("grill") || lowerName.includes("steak")) &&
    allergensArray.length > 0
  ) {
    potentialAllergens.push("Sesame");
    evidence.push(`"${name}" - grilled items may be cooked on shared surfaces`);
    rationale +=
      "Grilled items may be prepared on surfaces that also handle sesame oil or seeds. ";
    confidence = "Low";
  }

  // If no specific patterns found, still provide uncertainty analysis
  if (potentialAllergens.length === 0 && allergensArray.length > 0) {
    rationale = `Menu description for "${name}" does not explicitly list all ingredients. Cross-contact may occur during preparation, and sauces/marinades may contain allergens not mentioned. `;
    verification.push(
      `Ask: "Does ${name} contain any ${allergensArray.join(", ")} or come into contact with them during preparation?"`
    );
  }

  // Generate verification questions
  if (verification.length === 0) {
    if (potentialAllergens.length > 0) {
      verification.push(
        `Ask: "Can you confirm whether ${name} contains ${potentialAllergens.join(" or ")}?"`
      );
      verification.push(
        `Ask: "Is ${name} prepared on surfaces that also handle ${allergensArray.join(", ")}?"`
      );
    } else {
      verification.push(
        `Ask: "Can you verify the complete ingredient list for ${name}?"`
      );
      verification.push(
        `Ask: "Are there any hidden sources of ${allergensArray.join(", ")} in ${name}?"`
      );
    }
  }

  // Set confidence based on evidence strength
  if (potentialAllergens.length > 0 && evidence.length > 0) {
    confidence = evidence.length >= 2 ? "High" : "Medium";
  }

  // Ensure rationale uses uncertainty language
  if (!rationale) {
    rationale = `Based on the menu description, ${name} may contain allergens not explicitly listed. `;
  }

  return {
    potentialAllergens: potentialAllergens.filter(
      (a) => !matchedAllergens.includes(a)
    ),
    rationale: rationale.trim(),
    evidence: evidence.length > 0 ? evidence : [`"${dishText}"`],
    confidence,
    verification: verification.slice(0, 2), // Max 2 questions
  };
}
