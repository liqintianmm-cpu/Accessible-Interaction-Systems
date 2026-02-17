import { useMemo, useState } from "react";
import "./App.css";

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

  const riskOf = (item) => item.tags.some((t) => selected.has(t));

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
          Tip: Tap chips to toggle. We’ll highlight menu items that match.
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
          {filtered.map((item) => {
            const risky = riskOf(item);
            return (
              <div key={item.id} className={`item ${risky ? "risk" : ""}`}>
                <div className="itemTop">
                  <div className="itemName">{item.name}</div>
                  <div className={`badge ${risky ? "bad" : "ok"}`}>
                    {risky ? "Risk" : "OK"}
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
                        className={`tag ${selected.has(t) ? "hit" : ""}`}
                      >
                        {t}
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="footer">
        Next: we’ll add “Ask AI to check ingredients” flow + safe substitutes.
      </footer>
    </div>
  );
}

