#!/usr/bin/env node

import fs from "fs"
import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"
import { analyzeContract } from "@mantleguard/core/src/analyze.js"

const program = new Command()

program
  .command("analyze <file>")
  .option("--json", "Output JSON")
  .action((file, opts) => {
    if (!file.endsWith('.sol')) {
      console.error('ERROR: Cannot read "' + file + '" (this model does not support image input).')
      return
    }
    if (!fs.existsSync(file)) {
      console.error('ERROR: File not found: ' + file)
      return
    }
    const spinner = ora("Analyzing...").start()
    const source = fs.readFileSync(file, "utf-8")
    const result = analyzeContract(source)

    spinner.stop()

    if (result.error) {
      console.error(chalk.red("Error: " + result.error))
      process.exit(1)
    }

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2))
      return
    }

    console.log(chalk.bold("\n🛡️ MantleGuard Analysis Report\n"))

    console.log(
      `Gas Score: ${chalk.green(result.gasScore + "/100")} | ` +
      `Security Score: ${chalk.cyan(result.securityScore + "/100")}\n`
    )

    console.log(
      `${chalk.bold(result.findings.length + " findings")} · ` +
      `Savings: ${chalk.green(result.totalGasSaved + " gas")}\n`
    )

    function printSection(title, items, color) {
      if (items.length === 0) return

      console.log(color(`${title}`))
      console.log(color("─".repeat(title.length)))

      for (const f of items) {
        console.log(`${chalk.bold(f.id)} Line ${f.line}`)
        console.log(`  ${f.message}`)
        console.log(`  ${chalk.green("↓ " + f.gasSaving + " gas")}\n`)
      }
    }

    const grouped = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: []
    }

    for (const f of result.findings) {
      if (grouped[f.severity]) {
        grouped[f.severity].push(f)
      }
    }

    if (grouped.CRITICAL.length > 0) printSection("🚨 CRITICAL", grouped.CRITICAL, chalk.bgRed.white)
    printSection("🔥 HIGH", grouped.HIGH, chalk.red)
    printSection("⚠️ MEDIUM", grouped.MEDIUM, chalk.yellow)
    printSection("ℹ️ LOW", grouped.LOW, chalk.gray)
  })

program.parse()

if (!process.argv.slice(2).length) {
  program.outputHelp()
}

export { }