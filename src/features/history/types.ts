import type { Timestamp } from 'firebase/firestore'

export type HistoryType = 'basic' | 'percent' | 'date' | 'unit' | 'fx' | 'platform'

export type HistoryOutput = {
  summary: string
  copyValue?: string
}

export type HistoryItem = {
  id: string
  type: HistoryType
  title: string
  input: Record<string, unknown>
  output: HistoryOutput
  createdAt: Timestamp | null
}

export type HistoryWriteInput = {
  type: HistoryType
  title: string
  input: Record<string, unknown>
  output: HistoryOutput
}
