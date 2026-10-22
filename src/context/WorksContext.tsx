import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { works as staticWorks, type WorkItem } from '../data/works'
import { fetchWorks, WorksContext } from './works-context'

export function WorksProvider({ children }: { children: ReactNode }) {
  const [works, setWorks] = useState<WorkItem[]>(staticWorks)
  const [ready, setReady] = useState(false)
  const [fromApi, setFromApi] = useState(false)

  const apply = useCallback((next: WorkItem[] | null) => {
    if (!next) return false
    setWorks(next)
    setFromApi(true)
    setReady(true)
    return true
  }, [])

  const refresh = useCallback(async () => {
    const next = await fetchWorks()
    return apply(next)
  }, [apply])

  useEffect(() => {
    let cancelled = false
    fetchWorks().then((next) => {
      if (cancelled) return
      if (next) {
        setWorks(next)
        setFromApi(true)
      }
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => ({ works, ready, fromApi, refresh }), [works, ready, fromApi, refresh])

  return <WorksContext.Provider value={value}>{children}</WorksContext.Provider>
}
