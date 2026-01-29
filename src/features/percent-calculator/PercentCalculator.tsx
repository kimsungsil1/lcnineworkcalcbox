import { useEffect, useMemo, useState } from 'react'
import type { HistoryItem, HistoryWriteInput } from '../history/types'
import { formatTrimmedNumber } from '../../shared/utils/number'
import { useToast } from '../../shared/ui/Toast'

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
  const [row1Total, setRow1Total] = useState('')
  const [row1Rate, setRow1Rate] = useState('')
  const [row2Total, setRow2Total] = useState('')
  const [row2Part, setRow2Part] = useState('')
  const [row3Cost, setRow3Cost] = useState('')
  const [row3Price, setRow3Price] = useState('')
  const [row4Cost, setRow4Cost] = useState('')
  const [row4Margin, setRow4Margin] = useState('')
  const [row5Price, setRow5Price] = useState('')
  const [row5Discount, setRow5Discount] = useState('')
  const [row6Base, setRow6Base] = useState('')
  const [row6Vat, setRow6Vat] = useState('')
  const [results, setResults] = useState({
    row1: '',
    row2: '',
    row3: '',
    row4: '',
    row5: '',
    row6: '',
  })
  const { push } = useToast()

  useEffect(() => {
    if (selectedHistory?.type === 'percent') {
      const input = selectedHistory.input as Record<string, string>
      setRow1Total(String(input.row1Total ?? ''))
      setRow1Rate(String(input.row1Rate ?? ''))
      setRow2Total(String(input.row2Total ?? ''))
      setRow2Part(String(input.row2Part ?? ''))
      setRow3Cost(String(input.row3Cost ?? ''))
      setRow3Price(String(input.row3Price ?? ''))
      setRow4Cost(String(input.row4Cost ?? ''))
      setRow4Margin(String(input.row4Margin ?? ''))
      setRow5Price(String(input.row5Price ?? ''))
      setRow5Discount(String(input.row5Discount ?? ''))
      setRow6Base(String(input.row6Base ?? ''))
      setRow6Vat(String(input.row6Vat ?? ''))
      setResults({
        row1: String(input.resultRow1 ?? ''),
        row2: String(input.resultRow2 ?? ''),
        row3: String(input.resultRow3 ?? ''),
        row4: String(input.resultRow4 ?? ''),
        row5: String(input.resultRow5 ?? ''),
        row6: String(input.resultRow6 ?? ''),
      })
    }
  }, [selectedHistory])

  const handleReset = () => {
    setRow1Total('')
    setRow1Rate('')
    setRow2Total('')
    setRow2Part('')
    setRow3Cost('')
    setRow3Price('')
    setRow4Cost('')
    setRow4Margin('')
    setRow5Price('')
    setRow5Discount('')
    setRow6Base('')
    setRow6Vat('')
    setResults({ row1: '', row2: '', row3: '', row4: '', row5: '', row6: '' })
  }

  const handleCalculate = () => {
    const nextResults = computedResults

    onAddHistory({
      type: 'percent',
      title: '실무 퍼센트 계산',
      input: {
        row1Total,
        row1Rate,
        row2Total,
        row2Part,
        row3Cost,
        row3Price,
        row4Cost,
        row4Margin,
        row5Price,
        row5Discount,
        row6Base,
        row6Vat,
        resultRow1: nextResults.row1,
        resultRow2: nextResults.row2,
        resultRow3: nextResults.row3,
        resultRow4: nextResults.row4,
        resultRow5: nextResults.row5,
        resultRow6: nextResults.row6,
      },
      output: {
        summary: `1) ${nextResults.row1} | 2) ${nextResults.row2} | 3) ${nextResults.row3} | 4) ${nextResults.row4} | 5) ${nextResults.row5} | 6) ${nextResults.row6}`,
        copyValue: `1) ${nextResults.row1} | 2) ${nextResults.row2} | 3) ${nextResults.row3} | 4) ${nextResults.row4} | 5) ${nextResults.row5} | 6) ${nextResults.row6}`,
      },
    })
    push('기록에 저장했어요')
  }

  const computedResults = useMemo(() => {
    const total1 = toNumber(row1Total)
    const rate1 = toNumber(row1Rate)
    const row1 = total1 * (rate1 / 100)

    const total2 = toNumber(row2Total)
    const part2 = toNumber(row2Part)
    const row2 = total2 === 0 ? 0 : (part2 / total2) * 100

    const cost3 = toNumber(row3Cost)
    const price3 = toNumber(row3Price)
    const profit3 = price3 - cost3
    const margin3 = price3 === 0 ? 0 : (profit3 / price3) * 100
    const markup3 = cost3 === 0 ? 0 : (profit3 / cost3) * 100
    const margin3Text = formatTrimmedNumber(margin3)
    const markup3Text = formatTrimmedNumber(markup3)

    const cost4 = toNumber(row4Cost)
    const marginRate4 = toNumber(row4Margin)
    let row4Text = ''
    if (row4Cost || row4Margin) {
      if (marginRate4 >= 100) {
        row4Text = '마진율은 100% 미만이어야 합니다.'
      } else {
        const price4 = cost4 / (1 - marginRate4 / 100)
        const profit4 = price4 - cost4
        row4Text = `${formatTrimmedNumber(price4)} (이익 ${formatTrimmedNumber(profit4)})`
      }
    }

    const price5 = toNumber(row5Price)
    const discount5 = toNumber(row5Discount)
    const discounted5 = price5 * (1 - discount5 / 100)

    const base6 = toNumber(row6Base)
    const vat6 = toNumber(row6Vat)
    const withVat6 = base6 * (1 + vat6 / 100)
    const withoutVat6 = vat6 >= 100 ? 0 : base6 / (1 + vat6 / 100)

    return {
      row1: row1Total || row1Rate ? formatTrimmedNumber(row1) : '',
      row2: row2Total || row2Part ? `${formatTrimmedNumber(row2)}%` : '',
      row3: row3Cost || row3Price ? `마진 ${margin3Text}% / 마크업 ${markup3Text}%` : '',
      row4: row4Text,
      row5:
        row5Price || row5Discount
          ? `${formatTrimmedNumber(discounted5)} (할인 ${formatTrimmedNumber(price5 - discounted5)})`
          : '',
      row6:
        row6Base || row6Vat
          ? `포함 ${formatTrimmedNumber(withVat6)} / 제외 ${formatTrimmedNumber(withoutVat6)}`
          : '',
    }
  }, [
    row1Total,
    row1Rate,
    row2Total,
    row2Part,
    row3Cost,
    row3Price,
    row4Cost,
    row4Margin,
    row5Price,
    row5Discount,
    row6Base,
    row6Vat,
  ])

  useEffect(() => {
    setResults(computedResults)
  }, [computedResults])

  return (
    <section className="tool-card" aria-label="퍼센트 계산기">
      <div className="tool-header">
        <h2>퍼센트 계산기</h2>
        <p>실무에서 바로 쓰는 퍼센트/마진 계산을 제공합니다.</p>
      </div>
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
            <div className="percent-quick">
              {[10, 20, 30, 50].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRow1Rate(String(value))}
                >
                  {value}%
                </button>
              ))}
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
            원가 (예:6000) 와 판매가 (예:10000) 일 때 마진율은?
            <span
              className="help"
              aria-label="공식 도움말"
              data-tip="마진율 = (판매가-원가) ÷ 판매가 × 100"
              tabIndex={0}
            >
              ?
            </span>
            </label>
            <div className="percent-inputs">
              <input
                aria-label="원가"
                value={row3Cost}
                onChange={(event) => setRow3Cost(event.target.value)}
              />
              <input
                aria-label="판매가"
                value={row3Price}
                onChange={(event) => setRow3Price(event.target.value)}
              />
            </div>
            <div className="percent-result">{results.row3}</div>
          </div>
        <div className="percent-row">
          <label>
            원가 (예:6000) 에서 마진율 (예:40) %면 판매가는?
            <span
              className="help"
              aria-label="공식 도움말"
              data-tip="판매가 = 원가 ÷ (1 - 마진율 ÷ 100)"
              tabIndex={0}
            >
              ?
            </span>
            </label>
            <div className="percent-inputs">
              <input
                aria-label="원가"
                value={row4Cost}
                onChange={(event) => setRow4Cost(event.target.value)}
              />
              <input
                aria-label="마진율"
                value={row4Margin}
                onChange={(event) => setRow4Margin(event.target.value)}
              />
            </div>
            <div className="percent-quick">
              {[10, 20, 30, 40].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRow4Margin(String(value))}
                >
                  {value}%
                </button>
              ))}
            </div>
            <div className="percent-result">{results.row4}</div>
          </div>
        <div className="percent-row">
          <label>
            판매가 (예:10000) 에 할인율 (예:20) % 적용하면?
            <span
              className="help"
              aria-label="공식 도움말"
              data-tip="판매가 × (1 - 할인율 ÷ 100)"
              tabIndex={0}
            >
              ?
            </span>
          </label>
          <div className="percent-inputs">
            <input
              aria-label="판매가"
              value={row5Price}
              onChange={(event) => setRow5Price(event.target.value)}
            />
            <input
              aria-label="할인율"
              value={row5Discount}
              onChange={(event) => setRow5Discount(event.target.value)}
            />
          </div>
          <div className="percent-quick">
            {[10, 15, 20, 30].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRow5Discount(String(value))}
              >
                {value}%
              </button>
            ))}
          </div>
          <div className="percent-result">{results.row5}</div>
        </div>
        <div className="percent-row">
          <label>
            부가세율 (예:10) % 포함/제외 금액은?
            <span
              className="help"
              aria-label="공식 도움말"
              data-tip="포함=기준×(1+세율), 제외=기준÷(1+세율)"
              tabIndex={0}
            >
              ?
            </span>
          </label>
          <div className="percent-inputs">
            <input
              aria-label="기준 금액"
              value={row6Base}
              onChange={(event) => setRow6Base(event.target.value)}
            />
            <input
              aria-label="세율"
              value={row6Vat}
              onChange={(event) => setRow6Vat(event.target.value)}
            />
          </div>
          <div className="percent-quick">
            {[5, 10].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRow6Vat(String(value))}
              >
                {value}%
              </button>
            ))}
          </div>
          <div className="percent-result">{results.row6}</div>
        </div>
        <div className="percent-actions">
          <button type="button" onClick={handleReset}>
            초기화
          </button>
          <button type="button" className="primary" onClick={handleCalculate}>
            기록 저장
          </button>
          <button
            type="button"
            onClick={async () => {
              const text = `1) ${results.row1} | 2) ${results.row2} | 3) ${results.row3} | 4) ${results.row4} | 5) ${results.row5} | 6) ${results.row6}`
              await navigator.clipboard.writeText(text)
              push('복사됨')
            }}
          >
            전체 복사
          </button>
        </div>
      </div>
    </section>
  )
}
