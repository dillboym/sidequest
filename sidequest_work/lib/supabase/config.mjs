export function cleanEnv(value = '') {
  return value.trim().replace(/^['"]|['"]$/g, '').replace(/^[A-Z][A-Z0-9_]*\s*=\s*/, '').trim().replace(/^['"]|['"]$/g, '')
}

export function resolveSupabaseUrl(...values) {
  return values.map(value => cleanEnv(value)).find(value => {
    try {
      const url = new URL(value)
      return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
    } catch {
      return false
    }
  }) || ''
}

export function resolveSupabaseKey(...values) {
  return values.map(value => cleanEnv(value)).find(value => {
    if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) return true
    const parts = value.split('.')
    if (parts.length !== 3) return false
    try {
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      return JSON.parse(atob(payload)).role === 'anon'
    } catch {
      return false
    }
  }) || ''
}
