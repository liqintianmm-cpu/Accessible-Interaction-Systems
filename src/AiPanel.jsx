import { useEffect, useMemo, useRef, useState } from "react";
import { generateRiskExplanation } from "./riskEngine";

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
    const dish = {
      name: dishName,
      tags: dishTags || [],
    };
    return generateRiskExplanation(dish, selectedAllergens || new Set());
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
          : generateRiskExplanation(
              {
                name: dishName,
                tags: dishTags || [],
              },
              selectedAllergens || new Set()
            ),
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
