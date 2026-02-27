import { useMemo, useState } from "react";
import "./App.css";
import { analyzeDishWithLLM } from "./llmAnalysis";
import { evaluateDishRisk } from "./riskEngine";

const ALLERGENS = [
  "Peanuts",
  "Tree nuts",
  "Milk",
  "Egg",
  "Wheat",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
];

const MENU = [
  {
    id: "m1",
    name: "Chicken Salad",
    tags: ["Egg", "Milk"],
    note: "Contains mayo / dairy.",
  },
  {
    id: "m2",
    name: "Pad Thai",
    tags: ["Peanuts", "Soy", "Egg"],
    note: "Often uses peanut sauce / soy.",
  },
  {
    id: "m3",
    name: "Margherita Pizza",
    tags: ["Milk", "Wheat"],
    note: "Cheese + wheat crust.",
  },
  {
    id: "m4",
    name: "Shrimp Tacos",
    tags: ["Shellfish", "Wheat"],
    note: "Shrimp + flour tortilla.",
  },
  {
    id: "m5",
    name: "Steak & Veggies",
    tags: [],
    note: "No common allergens flagged.",
  },
];

function DishCard({ item, selectedAllergens }) {
  const [llmAnalysis, setLlmAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Rule-based matched allergens
  const { matchedAllergens, hasRisk: hasMatchedAllergens } = evaluateDishRisk(
    item,
    selectedAllergens
  );

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeDishWithLLM(item, selectedAllergens);
      setLlmAnalysis(result);
      setIsExpanded(true);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyStaffMessage = () => {
    const allergensList = Array.from(selectedAllergens).join(", ");
    if (!allergensList) {
      navigator.clipboard.writeText(
        `Hi! Could you confirm the complete ingredient list for "${item.name}" and help me avoid cross-contact? Thanks!`
      );
      return;
    }
    const uncertainties =
  (llmAnalysis?.potentialAllergens?.length ?? 0) > 0
    ? `, particularly ${llmAnalysis.potentialAllergens.join(" or ")}`
    : "";
    const message = `Hi! I'm allergic to ${allergensList}. Could you confirm whether "${item.name}" contains any of these allergens${uncertainties}, and help me avoid cross-contact? Thanks!`;
    navigator.clipboard.writeText(message);
  };

  return (
    <div className={`item ${hasMatchedAllergens ? "risk" : ""}`}>
      <div className="itemTop">
        <div className="itemName">{item.name}</div>
        <div className={`badge ${hasMatchedAllergens ? "bad" : "ok"}`}>
          {hasMatchedAllergens ? "Risk" : "OK"}
        </div>
      </div>

      <div className="itemNote">{item.note}</div>

      <div className="tags">
        {item.tags.length === 0 ? (
          <span className="tag muted">No tags</span>
        ) : (
          item.tags.map((t) => (
            <span
              key={t}
              className={`tag ${selectedAllergens.has(t) ? "hit" : ""}`}
            >
              {t}
            </span>
          ))
        )}
      </div>

      {/* Matched Allergens Section */}
      {hasMatchedAllergens && (
        <div className="matchedSection">
          <div className="sectionLabel">Matched allergens</div>
          <div className="matchedList">
            {matchedAllergens.map((allergen) => (
              <span key={allergen} className="matchedTag">
                {allergen}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Potential Hidden Allergens (LLM) Section */}
      <div className="llmSection">
        <div className="llmHeader">
          <div className="llmHeaderLeft">
            <span className="sectionLabel">Potential hidden allergens (LLM)</span>
            {llmAnalysis && (
              <button
                className="whyButton"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Hide" : "Why"}
              </button>
            )}
          </div>
          {!llmAnalysis && (
            <button
              className="analyzeButton"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze hidden risks"}
            </button>
          )}
        </div>

        {isAnalyzing && (
          <div className="loadingState">
            <div className="loadingSpinner"></div>
            <span>Analyzing dish description...</span>
          </div>
        )}

        {llmAnalysis && isExpanded && (
          <div className="llmResults">
            {llmAnalysis.potentialAllergens.length > 0 ? (
              <>
                <div className="resultSection">
                  <div className="resultLabel">Possible hidden allergens</div>
                  
                  {llmAnalysis.potentialAllergens.map((allergen, idx) => (
                    <div key={idx} className="allergenItem">
                      <div className="allergenHeader">
                        <span className="allergenName">{allergen}</span>
                        <span className={`confidenceBadge ${llmAnalysis.confidence.toLowerCase()}`}>
                          {llmAnalysis.confidence}
                        </span>
                      </div>
                      <div className="riskReason">
                        Why this might be risky: {llmAnalysis.rationale}
                      </div>
                      {llmAnalysis.evidence[idx] && (
                        <div className="evidenceQuote">
                          Based on: '{llmAnalysis.evidence[idx]}'
                        </div>
                      )}
                    </div>
                  ))}

                  {llmAnalysis.verification.length > 0 && (
                    <div className="verificationSection">
                      <div className="verificationLabel">What you can ask:</div>
                      <ul className="verificationList">
                        {llmAnalysis.verification.map((q, idx) => (
                          <li key={idx} className="verificationItem">
                            {q.replace(/^Ask:\s*/i, '')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="resultSection">
                <div className="resultText">
                  Menu description does not reveal obvious hidden allergens, but
                  cross-contact and unlisted ingredients may still pose risks.
                </div>
              </div>
            )}

            <div className="disclaimer">
              LLM cannot access kitchen ingredients. Please verify with staff.
            </div>

            <button className="copyButton" onClick={copyStaffMessage}>
              Copy staff message
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState(new Set(["Peanuts"]));
  const [query, setQuery] = useState("");

  const toggle = (a) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(a) ? next.delete(a) : next.add(a);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MENU.filter((item) => item.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1 className="title">Allergy Ordering</h1>
          <p className="subtitle">Pick allergens → see risky items instantly</p>
        </div>
        <div className="pill">
          {selected.size === 0 ? "No allergens selected" : `${selected.size} selected`}
        </div>
      </header>

      <section className="card">
        <h2 className="h2">My Allergens</h2>
        <div className="chips">
          {ALLERGENS.map((a) => (
            <button
              key={a}
              className={`chip ${selected.has(a) ? "on" : ""}`}
              onClick={() => toggle(a)}
            >
              {a}
            </button>
          ))}
        </div>
        <p className="hint">
          Tip: Tap chips to toggle. We'll highlight menu items that match.
        </p>
      </section>

      <section className="card">
        <div className="row">
          <h2 className="h2">Menu</h2>
          <input
            className="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes..."
          />
        </div>

        <div className="list">
          {filtered.map((item) => (
            <DishCard key={item.id} item={item} selectedAllergens={selected} />
          ))}
        </div>
      </section>
    </div>
  );
}