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

// Source: root .env.local (preferred) or .env
const SOURCE_LOCAL = path.join(ROOT, '.env.local')
const SOURCE_FALLBACK = path.join(ROOT, '.env')
const SOURCE = fs.existsSync(SOURCE_LOCAL) ? SOURCE_LOCAL : SOURCE_FALLBACK

// Targets: BOTH apps need env vars
const TARGETS = [
  path.join(ROOT, 'apps', 'merchant', '.env.local'),
  path.join(ROOT, 'apps', 'admin', '.env.local'),
]

// ─── Validate source exists ───────────────────────────────────────────────────
if (!fs.existsSync(SOURCE)) {
  console.error('❌  No .env.local or .env found at repo root.')
  console.error('    Run: cp .env.example .env.local')
  console.error('    Then fill in your values and retry.')
  process.exit(1)
}

const sourceContent = fs.readFileSync(SOURCE, 'utf-8')
const label = path.relative(ROOT, SOURCE)
console.log(`📄  Source: ${label}`)
console.log(`    Lines:  ${sourceContent.split('\n').length}`)
console.log()

// ─── Copy to each target ──────────────────────────────────────────────────────
let copied = 0
let skipped = 0

for (const target of TARGETS) {
  const dir = path.dirname(target)
  const relTarget = path.relative(ROOT, target)

  // Ensure target directory exists
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️   Directory not found, skipping: ${path.relative(ROOT, dir)}`)
    skipped++
    continue
  }

  const exists = fs.existsSync(target)

  if (exists && !FORCE) {
    console.log(`⏭️   Skipped (already exists): ${relTarget}`)
    console.log(`    Use --force to overwrite.`)
    skipped++
    continue
  }

  fs.writeFileSync(target, sourceContent, 'utf-8')
  const action = (exists && FORCE) ? 'Overwritten' : 'Copied'
  console.log(`✅  ${action}: ${relTarget}`)
  copied++
}

console.log()
console.log(`Done. ${copied} copied, ${skipped} skipped.`)
if (skipped > 0 && !FORCE) {
  console.log('Tip: run with --force to overwrite existing files.')
}
