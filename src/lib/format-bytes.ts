export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes < 1024) return `${Math.round(bytes)} B`
  if (bytes < 1024 * 1024) {
    const value = bytes / 1024
    return `${value.toFixed(value >= 10 ? 0 : 1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
