import TelegramBot from "node-telegram-bot-api"
import OpenAI from "openai"
import { analyzeContract } from "@mantleguard/core"

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true })
console.log("Bot started polling...")

bot.on("polling_error", (error) => {
    console.error("Polling error:", error.code, error.message);
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

async function runAudit(code) {
    // Static
    const staticResult = analyzeContract(code)

    // AI
    const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
            {
                role: "system",
                content: `Audit Solidity contract. Return JSON:
{
  "riskLevel": "HIGH|MEDIUM|LOW",
  "findings": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "title": "Issue",
      "description": "Explain",
      "fix": "Fix"
    }
  ]
}`
            },
            {
                role: "user",
                content: code
            }
        ]
    })

    let ai = { findings: [] }
    try {
        ai = JSON.parse(res.choices[0].message.content)
    } catch { }

    return {
        findings: [...ai.findings, ...staticResult.findings],
        gasScore: staticResult.gasScore,
        totalGasSaved: staticResult.totalGasSaved
    }
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id,
        "🛡️ MantleGuard Bot\n\nSend Solidity contract code to audit.")
})

bot.on("message", async (msg) => {
    console.log("Received message:", msg.text)
    const text = msg.text

    if (!text || !text.includes("contract")) return

    const loading = await bot.sendMessage(msg.chat.id, "🔍 Auditing...")

    try {
        const result = await runAudit(text)

        let reply = `🛡️ *MantleGuard Report*\n\n`
        reply += `Gas Score: ${result.gasScore}/100\n`
        reply += `Gas Saved: ${result.totalGasSaved}\n\n`

        result.findings.slice(0, 5).forEach(f => {
            reply += `• *${f.severity}* — ${f.title || f.type}\n`
            reply += `${f.description || f.message}\n\n`
        })

        bot.editMessageText(reply, {
            chat_id: msg.chat.id,
            message_id: loading.message_id,
            parse_mode: "Markdown"
        })

    } catch (e) {
        bot.sendMessage(msg.chat.id, "Error during audit")
    }
})