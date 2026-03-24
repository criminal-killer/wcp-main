# Localization Strategy
# SELLA

---

## Phase 1: Launch Languages

| Language | Code | Market |
|----------|------|--------|
| English | en | Default (global) |
| Swahili | sw | Kenya, Tanzania |
| French | fr | West Africa, DRC |

## Phase 2: Expansion Languages
Portuguese (pt), Arabic (ar), Hausa (ha), Yoruba (yo), Zulu (zu), Hindi (hi), Spanish (es), Bahasa Indonesia (id)

---

## Landing Page Translation
PHP language files: `lang/en.php`, `lang/sw.php`, `lang/fr.php`

```php
// lang/en.php
$lang = [
  'hero_title' => 'Sell smarter. On WhatsApp.',
  'hero_subtitle' => 'Your customers browse, buy, and pay — all inside WhatsApp.',
  'cta_waitlist' => 'Join the Waitlist — It\'s Free',
  'nav_features' => 'Features',
  'nav_pricing' => 'Pricing',
  ...
];
```

- **Auto-detect:** From browser `Accept-Language` header.
- **Selector:** Language selector in navbar: `[EN 🇬🇧]` `[SW 🇰🇪]` `[FR 🇫🇷]`

## Main App (Next.js) Translation
Use `next-intl` library (free):
- Dashboard UI translated via locale files
- Store owner picks preferred language in settings
- Stored in `org.language`

## WhatsApp Bot Translation
AI-powered translation via Groq/Gemini:
- Detect customer's language from their message
- Translate bot responses to customer's language
- Show store owner the original + translated message in inbox
- Store owner can reply in any language → AI translates
- **For MVP:** English only for bot messages. Add AI translation in Growth plan.

## Product Content
- Products are entered by store owner in their language.
- No auto-translation of product names/descriptions in MVP.
- AI translation of product content → Premium plan feature.
