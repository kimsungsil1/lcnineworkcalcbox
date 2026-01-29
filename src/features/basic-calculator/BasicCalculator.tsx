import { useEffect, useMemo, useState } from 'react'
import { formatNumberWithCommas, numberToKoreanWords } from '../../shared/utils/number'
import { safeEval } from '../../shared/utils/safeEval'
import type { HistoryItem, HistoryWriteInput } from '../history/types'
import { useToast } from '../../shared/ui/Toast'

const BUTTONS = [
  '7',
  '8',
  '9',
  '÷',
  '4',
  '5',
  '6',
  '×',
  '1',
  '2',
  '3',
  '-',
  '0',
  '.',
  '(',
  ')',
  '+',
]

const ALLOWED_KEYS = new Set([
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '.',
  '+',
  '-',
  '(',
  ')',
])

type BasicCalculatorProps = {
  onAddHistory: (entry: HistoryWriteInput) => void
  selectedHistory?: HistoryItem | null
}

export default function BasicCalculator({
  onAddHistory,
  selectedHistory,
}: BasicCalculatorProps) {
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { push } = useToast()

  useEffect(() => {
    if (selectedHistory?.type === 'basic') {
      const nextExpression = String(selectedHistory.input.expression ?? '')
      setExpression(nextExpression)
      try {
        const nextResult = safeEval(nextExpression)
        setResult(nextResult)
        setError(null)
      } catch {
        setResult(null)
        setError('수식을 확인해 주세요.')
      }
    }
  }, [selectedHistory])

  const handleButton = (value: string) => {
    setExpression((prev) => `${prev}${value}`)
  }

  const handleClear = () => {
    setExpression('')
    setResult(null)
    setError(null)
  }

  const handleBackspace = () => {
    setExpression((prev) => prev.slice(0, -1))
  }

  const handleCalculate = () => {
    try {
      const nextResult = safeEval(expression)
      setResult(nextResult)
      setError(null)
      const formatted = formatNumberWithCommas(nextResult)
      const korean = numberToKoreanWords(nextResult)
      onAddHistory({
        type: 'basic',
        title: '기본 계산',
        input: { expression },
        output: {
          summary: `${formatted} (${korean})`,
          copyValue: formatted,
        },
      })
    } catch (err) {
      if (err instanceof Error && err.message === 'division_by_zero') {
        setError('0으로 나눌 수 없습니다.')
      } else {
        setError('유효하지 않은 수식입니다.')
      }
      setResult(null)
    }
  }

  const keyMap = useMemo(
    () => ({
      '/': '÷',
      '*': '×',
    }),
    [],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        handleCalculate()
        return
      }

      if (event.key === 'Backspace') {
        event.preventDefault()
        handleBackspace()
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        handleClear()
        return
      }

      const mapped = keyMap[event.key as keyof typeof keyMap]
      if (mapped) {
        event.preventDefault()
        handleButton(mapped)
        return
      }

      if (ALLOWED_KEYS.has(event.key)) {
        event.preventDefault()
        handleButton(event.key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCalculate, handleBackspace, handleClear, handleButton, keyMap])

  const handleCopy = async () => {
    if (result === null) return
    const formatted = formatNumberWithCommas(result)
    await navigator.clipboard.writeText(formatted)
    push('복사됨')
  }

  const formattedResult = result !== null ? formatNumberWithCommas(result) : '--'
  const koreanResult = result !== null ? numberToKoreanWords(result) : ''

  return (
    <section className="tool-card" aria-label="기본 계산기">
      <div className="tool-header">
        <h2>기본 계산기</h2>
        <p>사칙연산과 괄호 입력을 지원합니다.</p>
      </div>
      <div className="basic-display">
        <input
          type="text"
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          placeholder="예: (12+3)×4"
          aria-label="계산식 입력"
        />
        <div className="basic-result">
          <div className="basic-number">{formattedResult}</div>
          <div className="basic-korean">{koreanResult}</div>
          {error && <div className="error-text">{error}</div>}
        </div>
      </div>
      <div className="basic-actions">
        <button type="button" onClick={handleCalculate} className="primary">
          계산
        </button>
        <button type="button" onClick={handleCopy} disabled={result === null}>
          결과 복사
        </button>
        <button type="button" onClick={handleBackspace}>
          지우기
        </button>
        <button type="button" onClick={handleClear}>
          전체 삭제
        </button>
      </div>
      <div className="basic-grid">
        {BUTTONS.map((button) => (
          <button
            key={button}
            type="button"
            className={['÷', '×', '-', '+'].includes(button) ? 'operator' : ''}
            onClick={() => handleButton(button)}
          >
            {button}
          </button>
        ))}
      </div>
    </section>
  )
}
