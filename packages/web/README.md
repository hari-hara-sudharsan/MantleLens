# MantleLens Web UI

A minimal React + Vite interface for auditing Solidity smart contracts using OpenAI.

## Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Configure OpenAI API Key:**
   - Copy `.env.example` to `.env.local`
   - Add your OpenAI API key:
     ```
     VITE_OPENAI_API_KEY=sk-...
     ```

3. **Start the dev server:**
   ```bash
   pnpm dev
   ```

The app will open at `http://localhost:5173`

## Features

- 📝 Paste Solidity contracts for analysis
- 🤖 AI-powered security auditing via GPT-4o-mini
- 📊 Risk level, gas score, and security score
- 🔍 Detailed findings with severity levels and fixes
- ⚡ Gas optimization recommendations

## Testing

Use this vulnerable contract to test:

```solidity
pragma solidity ^0.8.0;

contract VulnerableWithdraw {
    mapping(address => uint) balances;

    function withdraw(uint amount) public {
        require(balances[msg.sender] >= amount, "not enough");

        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok);

        balances[msg.sender] -= amount;
    }
}
```

**Key issues:** Reentrancy vulnerability (call before state update)
