import { useContext } from 'react'
import { WorksContext } from './works-context'

export function useWorks() {
  const value = useContext(WorksContext)
  if (!value) throw new Error('useWorks must be used within WorksProvider')
  return value
}
