import { useEffect, useState } from 'react'
import type { HistoryItem, HistoryWriteInput } from '../history/types'
import { formatTrimmedNumber } from '../../shared/utils/number'

const TABS = ['퍼센트계산', '학점계산', '비만도계산'] as const

type PercentCalculatorProps = {
  onAddHistory: (entry: HistoryWriteInput) => void
  selectedHistory?: HistoryItem | null
}

function toNumber(value: string) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

export default function PercentCalculator({
  onAddHistory,
  selectedHistory,
}: PercentCalculatorProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('퍼센트계산')
  const [row1Total, setRow1Total] = useState('')
  const [row1Rate, setRow1Rate] = useState('')
  const [row2Total, setRow2Total] = useState('')
  const [row2Part, setRow2Part] = useState('')
  const [row3Base, setRow3Base] = useState('')
  const [row3Change, setRow3Change] = useState('')
  const [row4Base, setRow4Base] = useState('')
  const [row4Rate, setRow4Rate] = useState('')
  const [results, setResults] = useState({
    row1: '',
    row2: '',
    row3: '',
    row4: '',
  })

  useEffect(() => {
    if (selectedHistory?.type === 'percent') {
      const input = selectedHistory.input as Record<string, string>
      setRow1Total(String(input.row1Total ?? ''))
      setRow1Rate(String(input.row1Rate ?? ''))
      setRow2Total(String(input.row2Total ?? ''))
      setRow2Part(String(input.row2Part ?? ''))
      setRow3Base(String(input.row3Base ?? ''))
      setRow3Change(String(input.row3Change ?? ''))
      setRow4Base(String(input.row4Base ?? ''))
      setRow4Rate(String(input.row4Rate ?? ''))
      setResults({
        row1: String(input.resultRow1 ?? ''),
        row2: String(input.resultRow2 ?? ''),
        row3: String(input.resultRow3 ?? ''),
        row4: String(input.resultRow4 ?? ''),
      })
    }
  }, [selectedHistory])

  const handleReset = () => {
    setRow1Total('')
    setRow1Rate('')
    setRow2Total('')
    setRow2Part('')
    setRow3Base('')
    setRow3Change('')
    setRow4Base('')
    setRow4Rate('')
    setResults({ row1: '', row2: '', row3: '', row4: '' })
  }

  const handleCalculate = () => {
    const total1 = toNumber(row1Total)
    const rate1 = toNumber(row1Rate)
    const row1 = total1 * (rate1 / 100)

    const total2 = toNumber(row2Total)
    const part2 = toNumber(row2Part)
    const row2 = total2 === 0 ? 0 : (part2 / total2) * 100

    const base3 = toNumber(row3Base)
    const change3 = toNumber(row3Change)
    const row3 = base3 === 0 ? 0 : ((change3 - base3) / base3) * 100
    const row3Sign = row3 >= 0 ? '+' : ''

    const base4 = toNumber(row4Base)
    const rate4 = toNumber(row4Rate)
    const row4 = base4 * (1 + rate4 / 100)

    const nextResults = {
      row1: formatTrimmedNumber(row1),
      row2: `${formatTrimmedNumber(row2)}%`,
      row3: `${row3Sign}${formatTrimmedNumber(row3)}%`,
      row4: formatTrimmedNumber(row4),
    }

    setResults(nextResults)

    onAddHistory({
      type: 'percent',
      title: '퍼센트 계산',
      input: {
        row1Total,
        row1Rate,
        row2Total,
        row2Part,
        row3Base,
        row3Change,
        row4Base,
        row4Rate,
        resultRow1: nextResults.row1,
        resultRow2: nextResults.row2,
        resultRow3: nextResults.row3,
        resultRow4: nextResults.row4,
      },
      output: {
        summary: `1) ${nextResults.row1} | 2) ${nextResults.row2} | 3) ${nextResults.row3} | 4) ${nextResults.row4}`,
        copyValue: nextResults.row1,
      },
    })
  }

  return (
    <section className="tool-card" aria-label="퍼센트 계산기">
      <div className="tool-header">
        <h2>계산기</h2>
        <p>퍼센트, 학점, 비만도 계산을 제공합니다.</p>
      </div>
      <div className="subtabs">
        {TABS.map((label) => (
          <button
            key={label}
            type="button"
            className={tab === label ? 'active' : ''}
            onClick={() => setTab(label)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === '퍼센트계산' ? (
        <div className="percent-grid">
          <div className="percent-row">
            <label>
              전체값 (예:10000) 의 비율값 (예:20) %는 얼마?
              <span
                className="help"
                aria-label="공식 도움말"
                data-tip="전체값 × (비율 ÷ 100)"
                tabIndex={0}
              >
                ?
              </span>
            </label>
            <div className="percent-inputs">
              <input
                aria-label="전체값"
                value={row1Total}
                onChange={(event) => setRow1Total(event.target.value)}
              />
              <input
                aria-label="비율값"
                value={row1Rate}
                onChange={(event) => setRow1Rate(event.target.value)}
              />
            </div>
            <div className="percent-result">{results.row1}</div>
          </div>
          <div className="percent-row">
            <label>
              전체값 (예:10000) 의 일부값 (예:500) 은 몇%?
              <span
                className="help"
                aria-label="공식 도움말"
                data-tip="(일부값 ÷ 전체값) × 100"
                tabIndex={0}
              >
                ?
              </span>
            </label>
            <div className="percent-inputs">
              <input
                aria-label="전체값"
                value={row2Total}
                onChange={(event) => setRow2Total(event.target.value)}
              />
              <input
                aria-label="일부값"
                value={row2Part}
                onChange={(event) => setRow2Part(event.target.value)}
              />
            </div>
            <div className="percent-result">{results.row2}</div>
          </div>
          <div className="percent-row">
            <label>
              전체값 (예:10000) 이/가 증감값 (예:25000) 으로 변하면?
              <span
                className="help"
                aria-label="공식 도움말"
                data-tip="((증감값-전체값) ÷ 전체값) × 100"
                tabIndex={0}
              >
                ?
              </span>
            </label>
            <div className="percent-inputs">
              <input
                aria-label="전체값"
                value={row3Base}
                onChange={(event) => setRow3Base(event.target.value)}
              />
              <input
                aria-label="증감값"
                value={row3Change}
                onChange={(event) => setRow3Change(event.target.value)}
              />
            </div>
            <div className="percent-result">{results.row3}</div>
          </div>
          <div className="percent-row">
            <label>
              전체값 (예:10000) 이/가 증감률 (예:25) % 증가하면?
              <span
                className="help"
                aria-label="공식 도움말"
                data-tip="전체값 × (1 + 증감률 ÷ 100)"
                tabIndex={0}
              >
                ?
              </span>
            </label>
            <div className="percent-inputs">
              <input
                aria-label="전체값"
                value={row4Base}
                onChange={(event) => setRow4Base(event.target.value)}
              />
              <input
                aria-label="증감률"
                value={row4Rate}
                onChange={(event) => setRow4Rate(event.target.value)}
              />
            </div>
            <div className="percent-result">{results.row4}</div>
          </div>
          <div className="percent-actions">
            <button type="button" onClick={handleReset}>
              초기화
            </button>
            <button type="button" className="primary" onClick={handleCalculate}>
              계산
            </button>
          </div>
        </div>
      ) : (
        <div className="placeholder-card">준비중</div>
      )}
    </section>
  )
}
