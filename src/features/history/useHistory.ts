import { useCallback, useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../../shared/firebase/firebase'
import type { HistoryItem, HistoryWriteInput } from './types'

const PAGE_SIZE = 50
const LOCAL_KEY = 'localHistory'

function loadLocalHistory() {
  const raw = localStorage.getItem(LOCAL_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as HistoryItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocalHistory(items: HistoryItem[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, 300)))
}

export function useHistory(user: User | null) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)

  const load = useCallback(
    async (reset = false) => {
      if (!user) {
        const local = loadLocalHistory()
        setItems(reset ? local : local)
        setHasMore(false)
        setLastDoc(null)
        return
      }
      setLoading(true)
      try {
        const baseQuery = query(
          collection(db, `users/${user.uid}/history`),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE),
        )

        const pagedQuery = reset
          ? baseQuery
          : lastDoc
            ? query(baseQuery, startAfter(lastDoc))
            : baseQuery

        const snapshot = await getDocs(pagedQuery)
        const nextItems = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            type: data.type,
            title: data.title,
            input: data.input ?? {},
            output: data.output ?? { summary: '' },
            createdAt: data.createdAt ?? null,
          } as HistoryItem
        })

        setItems((prev) => (reset ? nextItems : [...prev, ...nextItems]))
        setLastDoc(snapshot.docs.at(-1) ?? null)
        setHasMore(snapshot.docs.length === PAGE_SIZE)
      } finally {
        setLoading(false)
      }
    },
    [user, lastDoc],
  )

  const addHistory = useCallback(
    async (entry: HistoryWriteInput) => {
      if (!user) {
        const localItems = loadLocalHistory()
        const nextItem: HistoryItem = {
          id: `local-${Date.now()}`,
          type: entry.type,
          title: entry.title,
          input: entry.input,
          output: entry.output,
          createdAt: null,
        }
        const next = [nextItem, ...localItems]
        saveLocalHistory(next)
        setItems((prev) => [nextItem, ...prev])
        return
      }
      const docRef = await addDoc(collection(db, `users/${user.uid}/history`), {
        ...entry,
        createdAt: serverTimestamp(),
      })
      setItems((prev) => [
        {
          id: docRef.id,
          type: entry.type,
          title: entry.title,
          input: entry.input,
          output: entry.output,
          createdAt: null,
        },
        ...prev,
      ])
    },
    [user],
  )

  useEffect(() => {
    if (user) {
      setItems([])
      setLastDoc(null)
      setHasMore(true)
      load(true)
    } else {
      setItems([])
      setLastDoc(null)
      setHasMore(false)
      load(true)
    }
  }, [user, load])

  return {
    items,
    loading,
    hasMore,
    loadMore: () => load(false),
    reload: () => load(true),
    addHistory,
  }
}
