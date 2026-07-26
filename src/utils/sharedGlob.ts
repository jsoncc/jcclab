type GlobRawModule = string | { default: string }

export const rawFromGlob = (mod: GlobRawModule | undefined): string => {
  if (mod == null) return ''
  if (typeof mod === 'string') return mod
  return mod.default ?? ''
}

export const stemFromGlobPath = (globKey: string, ext: string): string | null => {
  const escaped = ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = globKey.match(new RegExp(`/([^/]+)\\.${escaped}$`))
  return m ? m[1] : null
}
