import { useEffect, useState } from 'react'
import { addDays, differenceInCalendarDays, parseISO } from 'date-fns'
import type { HistoryItem, HistoryWriteInput } from '../history/types'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatKoreanDate(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAYS[date.getDay()]
  return `${year}년 ${month}월 ${day}일(${weekday})`
}

type DateCalculatorProps = {
  onAddHistory: (entry: HistoryWriteInput) => void
  selectedHistory?: HistoryItem | null
}

export default function DateCalculator({
  onAddHistory,
  selectedHistory,
}: DateCalculatorProps) {
  const [tab, setTab] = useState<'add' | 'diff'>('add')
  const [startDate, setStartDate] = useState('')
  const [deltaDays, setDeltaDays] = useState('')
  const [addResult, setAddResult] = useState('')

  const [diffStart, setDiffStart] = useState('')
  const [diffEnd, setDiffEnd] = useState('')
  const [diffResult, setDiffResult] = useState('')

  useEffect(() => {
    if (selectedHistory?.type === 'date') {
      const input = selectedHistory.input as Record<string, string>
      if (input.mode === 'add') {
        setTab('add')
        setStartDate(String(input.startDate ?? ''))
        setDeltaDays(String(input.deltaDays ?? ''))
        setAddResult(String(input.result ?? ''))
      } else if (input.mode === 'diff') {
        setTab('diff')
        setDiffStart(String(input.diffStart ?? ''))
        setDiffEnd(String(input.diffEnd ?? ''))
        setDiffResult(String(input.result ?? ''))
      }
    }
  }, [selectedHistory])

  const handleAdd = () => {
    if (!startDate || !deltaDays) {
      setAddResult('날짜와 일수를 입력하세요.')
      return
    }
    const baseDate = parseISO(startDate)
    const delta = Number(deltaDays)
    const nextDate = addDays(baseDate, delta)
    const baseText = formatKoreanDate(baseDate).replace(/\(.+\)/, '')
    const sign = delta >= 0 ? '+' : '-'
    const output = `${baseText} ${sign} ${Math.abs(delta)}일 = ${formatKoreanDate(nextDate)}`
    setAddResult(output)
    onAddHistory({
      type: 'date',
      title: '날짜 계산',
      input: { mode: 'add', startDate, deltaDays, result: output },
      output: { summary: output, copyValue: output },
    })
  }

  const handleDiff = () => {
    if (!diffStart || !diffEnd) {
      setDiffResult('두 날짜를 입력하세요.')
      return
    }
    const start = parseISO(diffStart)
    const end = parseISO(diffEnd)
    const days = differenceInCalendarDays(end, start)
    const output = `${formatKoreanDate(start)}부터 ${formatKoreanDate(end)}까지 ${days}일`
    setDiffResult(output)
    onAddHistory({
      type: 'date',
      title: '날짜 차이',
      input: { mode: 'diff', diffStart, diffEnd, result: output },
      output: { summary: output, copyValue: String(days) },
    })
  }

  return (
    <section className="tool-card" aria-label="날짜 계산기">
      <div className="tool-header">
        <h2>날짜 계산기</h2>
        <p>일수 더하기/빼기와 날짜 차이를 계산합니다.</p>
      </div>
      <div className="subtabs">
        <button
          type="button"
          className={tab === 'add' ? 'active' : ''}
          onClick={() => setTab('add')}
        >
          날짜 더하기/빼기
        </button>
        <button
          type="button"
          className={tab === 'diff' ? 'active' : ''}
          onClick={() => setTab('diff')}
        >
          날짜 차이
        </button>
      </div>
      {tab === 'add' ? (
        <div className="date-grid">
          <label>
            시작일
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              aria-label="시작일"
            />
          </label>
          <label>
            증감 일수
            <input
              type="number"
              value={deltaDays}
              onChange={(event) => setDeltaDays(event.target.value)}
              aria-label="증감 일수"
            />
          </label>
          <button type="button" onClick={handleAdd} className="primary">
            계산
          </button>
          <div className="date-result" aria-live="polite">
            {addResult}
          </div>
        </div>
      ) : (
        <div className="date-grid">
          <label>
            시작일
            <input
              type="date"
              value={diffStart}
              onChange={(event) => setDiffStart(event.target.value)}
              aria-label="시작일"
            />
          </label>
          <label>
            종료일
            <input
              type="date"
              value={diffEnd}
              onChange={(event) => setDiffEnd(event.target.value)}
              aria-label="종료일"
            />
          </label>
          <button type="button" onClick={handleDiff} className="primary">
            계산
          </button>
          <div className="date-result" aria-live="polite">
            {diffResult}
          </div>
        </div>
      )}
    </section>
  )
}
