import { useEffect, useMemo, useState } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import type { HistoryItem, HistoryWriteInput } from '../history/types'
import { db } from '../../shared/firebase/firebase'
import { formatTrimmedNumber } from '../../shared/utils/number'
import { useToast } from '../../shared/ui/Toast'

const SUPPORTED = ['KRW', 'USD', 'CNY', 'JPY', 'EUR'] as const
const CACHE_KEY = 'fxRatesCache'

export type RatesCache = {
  base: string
  rates: Record<string, number>
  updatedAt: number
}

type FxCalculatorProps = {
  user: User | null
  onAddHistory: (entry: HistoryWriteInput) => void
  selectedHistory?: HistoryItem | null
}

export default function FxCalculator({
  user,
  onAddHistory,
  selectedHistory,
}: FxCalculatorProps) {
  const dbRef = isFirestore(db) ? db : null
  const [amount, setAmount] = useState('')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('KRW')
  const [rates, setRates] = useState<RatesCache | null>(null)
  const [status, setStatus] = useState<'loading' | 'fresh' | 'cache'>('loading')
  const [error, setError] = useState<string | null>(null)
  const { push } = useToast()

  useEffect(() => {
    if (selectedHistory?.type === 'fx') {
      const input = selectedHistory.input as Record<string, string>
      setAmount(String(input.amount ?? ''))
      setFromCurrency(String(input.fromCurrency ?? 'USD'))
      setToCurrency(String(input.toCurrency ?? 'KRW'))
    }
  }, [selectedHistory])

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as RatesCache
        setRates(parsed)
        setStatus('cache')
      } catch {
        localStorage.removeItem(CACHE_KEY)
      }
    }
  }, [])

  useEffect(() => {
    if (!user || !dbRef) return
    const fetchFromFirestore = async () => {
      try {
        const snapshot = await getDoc(doc(dbRef, 'appCache', 'fxRates'))
        if (snapshot.exists()) {
          const data = snapshot.data() as { base: string; rates: Record<string, number> }
          const nextRates: RatesCache = {
            base: data.base,
            rates: data.rates,
            updatedAt: Date.now(),
          }
          setRates(nextRates)
          localStorage.setItem(CACHE_KEY, JSON.stringify(nextRates))
        }
      } catch {
        // ignore
      }
    }
    fetchFromFirestore()
  }, [user, dbRef])

  useEffect(() => {
    const fetchRates = async () => {
      setStatus('loading')
      setError(null)
      try {
        const response = await fetch('https://api.frankfurter.app/latest?from=USD')
        if (!response.ok) {
          throw new Error('환율 요청 실패')
        }
        const data = await response.json()
        const nextRates: RatesCache = {
          base: data.base,
          rates: data.rates,
          updatedAt: Date.now(),
        }
        setRates(nextRates)
        setStatus('fresh')
        localStorage.setItem(CACHE_KEY, JSON.stringify(nextRates))
        if (user && dbRef) {
          await setDoc(doc(dbRef, 'appCache', 'fxRates'), {
            base: nextRates.base,
            rates: nextRates.rates,
            updatedAt: serverTimestamp(),
          })
        }
      } catch (err) {
        setStatus('cache')
        if (err instanceof Error) {
          setError(err.message)
        }
      }
    }

    fetchRates()
  }, [user, dbRef])

  const normalizedRates = useMemo(() => {
    if (!rates) return null
    return { ...rates.rates, [rates.base]: 1 }
  }, [rates])

  const converted = useMemo(() => {
    if (!normalizedRates) return ''
    const value = Number(amount)
    if (!Number.isFinite(value)) return ''
    const fromRate = normalizedRates[fromCurrency]
    const toRate = normalizedRates[toCurrency]
    if (!fromRate || !toRate) return ''
    const baseValue = value / fromRate
    const next = baseValue * toRate
    return formatTrimmedNumber(next)
  }, [amount, fromCurrency, toCurrency, normalizedRates])

  const handleSwap = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const handleSave = () => {
    if (!converted) return
    onAddHistory({
      type: 'fx',
      title: '환율 계산',
      input: { amount, fromCurrency, toCurrency },
      output: {
        summary: `${amount || 0} ${fromCurrency} → ${converted} ${toCurrency}`,
        copyValue: converted,
      },
    })
    push('기록에 저장했어요')
  }

  return (
    <section className="tool-card" aria-label="환율 계산기">
      <div className="tool-header">
        <h2>환율 계산기</h2>
        <p>Frankfurter API 실시간 환율을 사용합니다.</p>
      </div>
      {status === 'cache' && (
        <div className="banner">최근 환율(캐시) 사용 중</div>
      )}
      {error && <div className="error-text">{error}</div>}
      <div className="fx-grid">
        <label>
          금액
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-label="환전 금액"
          />
        </label>
        <div className="fx-quick">
          {[1, 10, 100, 1000].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(String(value))}
            >
              {value}
            </button>
          ))}
        </div>
        <label>
          기준 통화
          <select
            value={fromCurrency}
            onChange={(event) => setFromCurrency(event.target.value)}
            aria-label="기준 통화"
          >
            {SUPPORTED.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={handleSwap} className="swap">
          ↔
        </button>
        <label>
          변환 통화
          <select
            value={toCurrency}
            onChange={(event) => setToCurrency(event.target.value)}
            aria-label="변환 통화"
          >
            {SUPPORTED.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>
        <div className="fx-output">
          <div className="fx-value">{converted}</div>
          <div className="fx-meta">1 {fromCurrency} 기준 환율</div>
        </div>
        <button type="button" className="primary" onClick={handleSave}>
          기록 저장
        </button>
        <button
          type="button"
          onClick={async () => {
            if (!converted) return
            await navigator.clipboard.writeText(converted)
            push('복사됨')
          }}
        >
          결과 복사
        </button>
      </div>
    </section>
  )
}

function isFirestore(value: unknown): value is Firestore {
  return Boolean(value && typeof (value as Firestore).type === 'string')
}
