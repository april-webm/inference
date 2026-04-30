import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity'

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
})

export function containsProfanity(text: string): boolean {
  return matcher.hasMatch(text)
}

export function validateDisplayName(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = raw.trim()
  if (trimmed.length < 2) return { ok: false, error: 'Display name must be at least 2 characters.' }
  if (trimmed.length > 40) return { ok: false, error: 'Display name must be 40 characters or fewer.' }
  if (containsProfanity(trimmed)) {
    return { ok: false, error: 'Display name contains disallowed language. Pick another.' }
  }
  return { ok: true, value: trimmed }
}
