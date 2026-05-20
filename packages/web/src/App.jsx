import { useState } from "react"
import { runAudit } from "./lib/audit"

const severityColor = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MEDIUM: "#ca8a04",
  LOW: "#6b7280"
}

function Section({ title, items }) {
  if (!items.length) return null

  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ color: "#1f2937", marginBottom: 12 }}>{title}</h3>

      {items.map((f, i) => (
        <div
          key={i}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 12,
            marginBottom: 10,
            backgroundColor: "#ffffff"
          }}
        >
          <div
            style={{
              color: severityColor[f.severity],
              fontWeight: "bold",
              marginBottom: 8,
              fontSize: 14
            }}
          >
            {f.severity} — {f.title || f.type}
          </div>

          <p style={{ margin: "8px 0", color: "#4b5563", fontSize: 13 }}>
            {f.description || f.message}
          </p>

          {f.fix && (
            <p
              style={{
                margin: "8px 0",
                color: "#1f2937",
                fontStyle: "italic",
                fontSize: 13
              }}
            >
              <strong>Fix:</strong> {f.fix}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [code, setCode] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleAudit() {
    setLoading(true)
    const res = await runAudit(code)
    setResult(res)
    setLoading(false)
  }

  // Group findings by severity
  function getGroupedFindings() {
    const grouped = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: []
    }

    if (result.findings) {
      result.findings.forEach(f => {
        const sev = f.severity || "LOW"
        if (grouped[sev]) {
          grouped[sev].push(f)
        }
      })
    }

    return grouped
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>MantleLens - Smart Contract Auditor</h1>

      <div style={{ marginBottom: "20px" }}>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your Solidity contract here..."
          style={{
            width: "100%",
            height: "300px",
            padding: "10px",
            fontFamily: "monospace",
            fontSize: "12px",
            border: "1px solid #ccc"
          }}
        />
      </div>

      <button
        onClick={handleAudit}
        disabled={loading || !code.trim()}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.5 : 1
        }}
      >
        {loading ? "Auditing..." : "Run Audit"}
      </button>

      {result && (
        <div style={{ marginTop: "30px" }}>
          {/* Summary Header */}
          <div
            style={{
              padding: 16,
              borderBottom: "1px solid #e5e7eb",
              background: "#111827",
              color: "white",
              borderRadius: "8px 8px 0 0"
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20 }}>🛡️ MantleGuard Audit</h2>

            <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14 }}>
                <strong>Gas Score:</strong> {result.gasScore || 0}/100
              </span>
              <span style={{ fontSize: 14 }}>
                <strong>Security Score:</strong> {result.securityScore || 0}/100
              </span>
              {result.totalGasSaved && (
                <span style={{ fontSize: 14 }}>
                  <strong>Gas Saved:</strong> {result.totalGasSaved}
                </span>
              )}
            </div>
          </div>

          {/* Findings Sections */}
          <div
            style={{
              padding: 20,
              backgroundColor: "#ffffff",
              borderRadius: "0 0 8px 8px",
              border: "1px solid #e5e7eb"
            }}
          >
            {result.findings && result.findings.length > 0 ? (
              <>
                {(() => {
                  const grouped = getGroupedFindings()
                  return (
                    <div>
                      <Section
                        title="🔴 Critical Issues"
                        items={grouped.CRITICAL}
                      />
                      <Section title="🟠 High Issues" items={grouped.HIGH} />
                      <Section
                        title="🟡 Medium Issues"
                        items={grouped.MEDIUM}
                      />
                      <Section title="🔵 Low Issues" items={grouped.LOW} />

                      {result.findings.length === 0 && (
                        <div
                          style={{
                            padding: "15px",
                            backgroundColor: "#e8f5e9",
                            borderRadius: "4px"
                          }}
                        >
                          ✅ No findings! Contract looks good.
                        </div>
                      )}
                    </div>
                  )
                })()}
              </>
            ) : (
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#e8f5e9",
                  borderRadius: "4px"
                }}
              >
                ✅ No findings! Contract looks good.
              </div>
            )}

            {result.error && (
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#ffebee",
                  borderRadius: "4px",
                  marginTop: "15px"
                }}
              >
                ❌ <strong>Error:</strong> {result.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
