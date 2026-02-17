import { useEffect, useMemo, useRef, useState } from "react";

function makeAssistantReply({ dishName, dishTags, selectedAllergens }) {
  const hits = dishTags.filter((t) => selectedAllergens.has(t));
  const hasRisk = hits.length > 0;

  if (!dishName) {
    return `Tell me the dish name, and I’ll check allergen risks and suggest safer options.`;
  }

  if (!hasRisk) {
    return `✅ Looks OK: "${dishName}" doesn’t match your selected allergens.
If you want, ask the server to confirm sauces/marinades to be safe.`;
  }

  return `⚠️ Potential risk for "${dishName}": matches ${hits.join(", ")}.
Safer options:
• Ask for NO ${hits.join(" / ")} (if possible)
• Request sauce on the side
• Choose a simpler dish (grilled meat + veggies)
Would you like a short message you can show the staff?`;
}

export default function AiPanel({
  open,
  onClose,
  context, // { dishName, dishTags, selectedAllergens }
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  const starter = useMemo(() => {
    const { dishName, dishTags, selectedAllergens } = context || {};
    return makeAssistantReply({ dishName, dishTags, selectedAllergens });
  }, [context]);

  useEffect(() => {
    if (!open) return;
    // When opened, inject a fresh assistant hint based on current context
    setMessages([
      {
        role: "assistant",
        text: starter,
        ts: Date.now(),
      },
    ]);
    setInput("");
  }, [open, starter]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg = { role: "user", text, ts: Date.now() };
    const { dishName, dishTags, selectedAllergens } = context || {};

    const assistantMsg = {
      role: "assistant",
      text:
        text.toLowerCase().includes("staff") || text.toLowerCase().includes("message")
          ? `Here’s a staff-friendly message:\n"Hi! I’m allergic to ${[...selectedAllergens].join(
              ", "
            )}. Could you confirm whether '${dishName}' contains any of these, and help me avoid cross-contact? Thanks!"`
          : makeAssistantReply({ dishName, dishTags, selectedAllergens }),
      ts: Date.now() + 1,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  };

  if (!open) return null;

  return (
    <div className="aiOverlay" onClick={onClose}>
      <div className="aiPanel" onClick={(e) => e.stopPropagation()}>
        <div className="aiHeader">
          <div>
            <div className="aiTitle">Ask AI</div>
            <div className="aiSub">
              Context: {context?.dishName ? context.dishName : "No dish selected"}
            </div>
          </div>
          <button className="aiClose" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="aiBody">
          {messages.map((m) => (
            <div key={m.ts} className={`bubble ${m.role}`}>
              {m.text.split("\n").map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="aiInputRow">
          <input
            className="aiInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Try: "Give me a staff message"'
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button className="aiSend" onClick={send}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
