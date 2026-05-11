/**
 * Simple smoke test to verify key pages return 200.
 * Run with: node scripts/smoke-test.js
 *
 * For production, replace with Playwright for actual browser testing.
 */

const BASE_URL = process.env.SMOKE_TEST_URL || 'http://localhost:3000'

const routes = [
  { path: '/', name: 'Landing Page' },
  { path: '/sign-in', name: 'Sign In' },
  { path: '/sign-up/choose-plan', name: 'Choose Plan' },
  { path: '/affiliates/apply', name: 'Affiliate Apply' },
  { path: '/store/demo', name: 'Demo Store' },
]

async function smokeTest() {
  console.log(`🔍 Running smoke tests against ${BASE_URL}\n`)

  let passed = 0
  let failed = 0

  for (const route of routes) {
    const url = `${BASE_URL}${route.path}`
    try {
      const res = await fetch(url, { method: 'HEAD' })
      if (res.ok || res.status === 304) {
        console.log(`✅ ${route.name}: ${res.status}`)
        passed++
      } else {
        console.log(`❌ ${route.name}: ${res.status}`)
        failed++
      }
    } catch (err) {
      console.log(`❌ ${route.name}: ${err.message}`)
      failed++
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

smokeTest()