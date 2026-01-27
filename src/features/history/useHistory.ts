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

export function useHistory(user: User | null) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)

  const load = useCallback(
    async (reset = false) => {
      if (!user) return
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
      if (!user) return
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
      setHasMore(true)
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
