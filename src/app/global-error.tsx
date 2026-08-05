"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "Georgia, Times New Roman, serif",
          background: "#faf9f6",
          color: "#1a1a1a",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
          Something went wrong
        </h1>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#1a1a1a",
            color: "#faf9f6",
            border: "none",
            borderRadius: "9999px",
            padding: "0.625rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
