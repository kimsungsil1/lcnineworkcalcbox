import { useMemo, useState } from 'react'
import type { HistoryItem, HistoryType } from './types'
import { useToast } from '../../shared/ui/Toast'

const TYPE_LABELS: Record<HistoryType, string> = {
  basic: '기본 계산기',
  percent: '퍼센트',
  date: '날짜',
  unit: '단위 변환',
  fx: '환율',
}

const FILTERS: Array<{ value: 'all' | HistoryType; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'basic', label: '기본' },
  { value: 'percent', label: '퍼센트' },
  { value: 'date', label: '날짜' },
  { value: 'unit', label: '단위' },
  { value: 'fx', label: '환율' },
]

type HistoryPanelProps = {
  items: HistoryItem[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onSelect: (item: HistoryItem) => void
}

export default function HistoryPanel({
  items,
  loading,
  hasMore,
  onLoadMore,
  onSelect,
}: HistoryPanelProps) {
  const [filter, setFilter] = useState<'all' | HistoryType>('all')
  const { push } = useToast()

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((item) => item.type === filter)
  }, [items, filter])

  const handleCopy = async (value?: string) => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    push('복사됨')
  }

  return (
    <section className="history-panel" aria-label="기록">
      <div className="history-header">
        <h2>기록</h2>
        <select
          aria-label="기록 필터"
          value={filter}
          onChange={(event) => setFilter(event.target.value as 'all' | HistoryType)}
        >
          {FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="history-list">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="history-item"
            role="button"
            tabIndex={0}
            onClick={() => onSelect(item)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(item)
              }
            }}
          >
            <div>
              <div className="history-title">{item.title}</div>
              <div className="history-meta">
                {TYPE_LABELS[item.type]}
              </div>
              <div className="history-summary">{item.output.summary}</div>
            </div>
            <span className="history-copy">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  handleCopy(item.output.copyValue ?? '')
                }}
                aria-label="결과 복사"
              >
                복사
              </button>
            </span>
          </div>
        ))}
      </div>
      <div className="history-footer">
        <button type="button" onClick={onLoadMore} disabled={loading || !hasMore}>
          {loading ? '불러오는 중…' : hasMore ? '더보기' : '마지막 기록'}
        </button>
      </div>
    </section>
  )
}
