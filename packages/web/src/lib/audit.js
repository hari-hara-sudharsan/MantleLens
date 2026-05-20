import OpenAI from "openai"
import { analyzeContract } from "@mantleguard/core"

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

export async function runAudit(code) {
  // 1. Static analysis
  const staticResult = analyzeContract(code)

  // 2. AI audit
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You are a smart contract auditor specialized in Solidity and Mantle L2.

Return ONLY JSON:
{
  "riskLevel": "HIGH|MEDIUM|LOW",
  "findings": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "title": "Issue",
      "description": "What is wrong",
      "fix": "How to fix"
    }
  ]
}`
      },
      {
        role: "user",
        content: `Audit this Solidity contract:\n\n${code}`
      }
    ]
  })

  let aiResult
  try {
    aiResult = JSON.parse(response.choices[0].message.content)
  } catch {
    aiResult = { findings: [] }
  }

  // 3. Merge findings
  const combinedFindings = [
    ...(aiResult.findings || []),
    ...(staticResult.findings || [])
  ]

  // 4. Final scores (use static for gas, AI for security fallback)
  return {
    findings: combinedFindings,
    gasScore: staticResult.gasScore,
    securityScore: aiResult.securityScore || staticResult.securityScore,
    totalGasSaved: staticResult.totalGasSaved,
    riskLevel: aiResult.riskLevel || (staticResult.securityScore < 30 ? "HIGH" : staticResult.securityScore < 70 ? "MEDIUM" : "LOW")
  }
}