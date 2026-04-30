// Allowed email domain suffixes.
// Edu domains are matched by suffix so "student.unimelb.edu.au" passes.
const ALLOWED_EDU_SUFFIXES = [
  '.edu',
  '.edu.au',
  '.ac.uk',
  '.ac.nz',
  '.ac.jp',
  '.edu.sg',
  '.edu.hk',
]

// Major non-edu providers we trust.
const ALLOWED_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'yahoo.com',
  'protonmail.com',
  'proton.me',
  'pm.me',
  'fastmail.com',
])

export function isAllowedEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false

  if (ALLOWED_DOMAINS.has(domain)) return true
  if (ALLOWED_EDU_SUFFIXES.some((suffix) => domain.endsWith(suffix))) return true

  return false
}
