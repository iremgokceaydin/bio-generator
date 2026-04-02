"use client";

import { useState } from "react";

export default function Home() {
  const [bioLength, setBioLength] = useState(40);
  const [emojis, setEmojis] = useState(18);
  const [reality, setReality] = useState(85);
  const [career, setCareer] = useState(88);
  const [aggression, setAggression] = useState(15);

  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateBio() {
    setLoading(true);
    setError("");
    setBio("");

    try {
      const res = await fetch("/api/generate-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bioLength,
          emojis,
          reality,
          career,
          aggression,
          // model is intentionally ignored server-side, keeping here as reference in the call
          model: "google/gemini-3-flash-preview"
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      setBio(data.bio || "");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 760,
        margin: "48px auto",
        padding: 24,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>
        AI Bio Generator
      </h1>

      <p style={{ color: "#555", marginBottom: 24 }}>
        Adjust the sliders to control tone and emphasis.
        Facts come strictly from <code>profile.json</code>.
      </p>

      <section style={{ display: "grid", gap: 18 }}>
        <Slider
          label="Bio length (words)"
          min={10}
          max={200}
          value={bioLength}
          onChange={setBioLength}
        />

        <Slider
          label="Emojis"
          min={0}
          max={30}
          value={emojis}
          onChange={setEmojis}
        />

        <Slider
          label="Reality / strictness"
          min={0}
          max={100}
          value={reality}
          onChange={setReality}
        />

        <Slider
          label="Career emphasis"
          min={0}
          max={100}
          value={career}
          onChange={setCareer}
        />

        <Slider
          label="Aggression / boldness"
          min={0}
          max={100}
          value={aggression}
          onChange={setAggression}
        />

        <button
          onClick={generateBio}
          disabled={loading}
          style={{
            marginTop: 16,
            padding: "14px 18px",
            borderRadius: 10,
            border: "none",
            fontSize: 16,
            cursor: loading ? "default" : "pointer",
            background: loading ? "#ccc" : "#000",
            color: "#fff",
          }}
        >
          {loading && <Spinner />}
          {loading ? "Generating…" : "Generate bio"}
        </button>

        {error && (
          <div style={{ color: "crimson", marginTop: 12 }}>
            {error}
          </div>
        )}

        {bio && (
          <div
            style={{
              marginTop: 24,
              padding: 18,
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "#fafafa",
              whiteSpace: "pre-wrap",
            }}
          >
            {bio}
          </div>
        )}
      </section>
    </main>
  );
}

function Slider({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Spinner() {
  return (
    <span
      aria-label="Loading"
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.35)",
        borderTopColor: "#fff",
        display: "inline-block",
        margin: "0 4px -2px 0",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}