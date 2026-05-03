#!/usr/bin/env node
/**
 * scripts/sync-env.mjs
 *
 * Copies root .env.local into each app's directory.
 * Safe by default — does NOT overwrite existing .env.local files.
 * Use --force flag to overwrite.
 *
 * Usage:
 *   node scripts/sync-env.mjs
 *   node scripts/sync-env.mjs --force
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const FORCE = process.argv.includes('--force')

// Source: root .env.local
const SOURCE = path.join(ROOT, '.env.local')

// Targets: each app that needs env vars
const TARGETS = [
  path.join(ROOT, 'wacommerce', 'admin-panel', '.env.local'),
  // Add more app paths here as the monorepo grows
]

// ─── Validate source exists ───────────────────────────────────────────────────
if (!fs.existsSync(SOURCE)) {
  console.error('❌  No .env.local found at repo root.')
  console.error('    Run: cp .env.example .env.local')
  console.error('    Then fill in your values and retry.')
  process.exit(1)
}

const sourceContent = fs.readFileSync(SOURCE, 'utf-8')
console.log(`📄  Source: ${SOURCE}`)
console.log(`    Lines:  ${sourceContent.split('\n').length}`)
console.log()

// ─── Copy to each target ──────────────────────────────────────────────────────
let copied = 0
let skipped = 0

for (const target of TARGETS) {
  const dir = path.dirname(target)

  // Ensure target directory exists (it should, but just in case)
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️   Directory not found, skipping: ${dir}`)
    skipped++
    continue
  }

  if (fs.existsSync(target) && !FORCE) {
    console.log(`⏭️   Skipped (already exists): ${path.relative(ROOT, target)}`)
    console.log(`    Use --force to overwrite.`)
    skipped++
    continue
  }

  fs.writeFileSync(target, sourceContent, 'utf-8')
  const label = FORCE && fs.existsSync(target) ? 'Overwritten' : 'Copied'
  console.log(`✅  ${label}: ${path.relative(ROOT, target)}`)
  copied++
}

console.log()
console.log(`Done. ${copied} copied, ${skipped} skipped.`)
if (skipped > 0 && !FORCE) {
  console.log('Tip: run with --force to overwrite existing files.')
}
