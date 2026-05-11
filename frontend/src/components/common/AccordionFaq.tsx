"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

type Props = {
  items: FaqItem[];
  defaultOpen?: number;
};

export default function AccordionFaq({ items, defaultOpen = 0 }: Props) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            style={{
              border: "1px solid var(--mf-border)",
              borderRadius: "18px",
              overflow: "hidden",
              marginBottom: "12px",
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "1rem 1.25rem",
                background: isOpen ? "#fff3e5" : "#ffffff",
                color: isOpen ? "var(--mf-orange)" : "var(--mf-dark)",
                border: "none",
                fontWeight: 900,
                fontSize: "0.9375rem",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                transition: "background 0.18s ease, color 0.18s ease",
              }}
            >
              {item.question}
              <i
                className={`bi bi-chevron-${isOpen ? "up" : "down"}`}
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              ></i>
            </button>
            {isOpen && (
              <div
                style={{
                  padding: "1rem 1.25rem",
                  background: "#ffffff",
                  color: "var(--mf-muted)",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
