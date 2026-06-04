"use client";

import { useState, useEffect, useRef } from "react";
import { autocompleteETFs } from "@/lib/api";

export function SearchBar({
  onSelect,
}: {
  onSelect: (t: string) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<
    { symbol: string; name: string }[]
  >([]);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.length < 1) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setResults(await autocompleteETFs(q));
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, []);

  return (
    <div ref={wrap} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <svg
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            width: 14,
            height: 14,
            color: "rgba(255,255,255,0.5)",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 2,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            pointerEvents: "none",
          }}
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="搜尋 ETF..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value.toUpperCase());
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          style={{
            width: "100%",
            height: 34,
            borderRadius: 6,
            border: 0,
            padding: "0 10px 0 32px",
            fontSize: 13,
            background: "rgba(255,255,255,0.18)",
            color: "#fff",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 9999,
            marginTop: 4,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            overflow: "hidden",
          }}
        >
          {results.map((r) => (
            <div
              key={r.symbol}
              onClick={() => {
                setQ(r.symbol);
                setOpen(false);
                onSelect(r.symbol);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 13,
                borderBottom: "1px solid #f1f5f9",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#eff6ff")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "")
              }
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 56,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: "#2563eb",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {r.symbol}
              </span>
              <span
                style={{
                  color: "#334155",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
