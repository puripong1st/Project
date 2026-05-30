"use client";

import React from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  illustration?: "inbox" | "search" | "rooms" | "users";
};

export default function EmptyState({
  title,
  description,
  illustration = "inbox",
}: EmptyStateProps) {
  // Render appropriate inline SVG illustration based on type
  const renderIllustration = () => {
    switch (illustration) {
      case "search":
        return (
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="56" cy="56" r="32" stroke="url(#paint0_linear)" strokeWidth="3" strokeDasharray="6 4" />
            <path d="M78 78L102 102" stroke="url(#paint1_linear)" strokeWidth="5" strokeLinecap="round" />
            <path d="M44 48H68" stroke="var(--border-medium)" strokeWidth="3" strokeLinecap="round" />
            <path d="M44 60H60" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="56" cy="56" r="4" fill="var(--edu-pink)" />
            <defs>
              <linearGradient id="paint0_linear" x1="24" y1="24" x2="88" y2="88" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--smartaccess-purple)" />
                <stop offset="1" stopColor="var(--edu-pink)" />
              </linearGradient>
              <linearGradient id="paint1_linear" x1="78" y1="78" x2="102" y2="102" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--edu-pink)" />
                <stop offset="1" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
        );
      case "rooms":
        return (
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="24" y="24" width="72" height="60" rx="8" stroke="url(#paint0_linear)" strokeWidth="3" />
            <path d="M38 84V96" stroke="var(--border-medium)" strokeWidth="3" strokeLinecap="round" />
            <path d="M82 84V96" stroke="var(--border-medium)" strokeWidth="3" strokeLinecap="round" />
            <path d="M38 96H82" stroke="var(--border-medium)" strokeWidth="3" strokeLinecap="round" />
            <rect x="36" y="36" width="48" height="32" rx="4" fill="var(--smartaccess-purple-pale)" stroke="var(--border)" strokeWidth="2" />
            <circle cx="60" cy="52" r="6" fill="var(--edu-pink)" />
            <defs>
              <linearGradient id="paint0_linear" x1="24" y1="24" x2="96" y2="84" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--smartaccess-purple)" />
                <stop offset="1" stopColor="var(--edu-pink)" />
              </linearGradient>
            </defs>
          </svg>
        );
      case "users":
        return (
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="44" r="16" stroke="url(#paint0_linear)" strokeWidth="3" />
            <path d="M26 92C26 74.3269 41.2223 60 60 60C78.7777 60 94 74.3269 94 92" stroke="url(#paint0_linear)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="36" cy="56" r="8" fill="var(--smartaccess-purple-pale)" />
            <circle cx="84" cy="56" r="8" fill="var(--edu-pink-pale)" />
            <defs>
              <linearGradient id="paint0_linear" x1="26" y1="28" x2="94" y2="92" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--smartaccess-purple)" />
                <stop offset="1" stopColor="var(--edu-pink)" />
              </linearGradient>
            </defs>
          </svg>
        );
      case "inbox":
      default:
        return (
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 76H40C44 76 46 78 48 82C51 88 54 90 60 90C66 90 69 88 72 82C74 78 76 76 80 76H100" stroke="url(#paint0_linear)" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="20" y="30" width="80" height="60" rx="10" stroke="url(#paint0_linear)" strokeWidth="3" />
            <line x1="38" y1="46" x2="82" y2="46" stroke="var(--border-medium)" strokeWidth="3" strokeLinecap="round" />
            <line x1="46" y1="58" x2="74" y2="58" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
            <defs>
              <linearGradient id="paint0_linear" x1="20" y1="30" x2="100" y2="90" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--smartaccess-purple)" />
                <stop offset="1" stopColor="var(--edu-pink)" />
              </linearGradient>
            </defs>
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        padding: "60px 20px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(124, 58, 237, 0.01)",
        borderRadius: 20,
        border: "1.5px dashed var(--border)",
        margin: "12px 0"
      }}
      className="animate-fade-in"
    >
      <div style={{ marginBottom: 20, filter: "drop-shadow(0 8px 16px rgba(124, 58, 237, 0.08))" }}>
        {renderIllustration()}
      </div>
      <h4 style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 8px 0" }}>
        {title}
      </h4>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 380, margin: 0, lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  );
}
