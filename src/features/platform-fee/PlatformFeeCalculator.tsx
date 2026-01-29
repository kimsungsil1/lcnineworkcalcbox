import { useEffect, useMemo, useState } from 'react'
import type { HistoryItem, HistoryWriteInput } from '../history/types'
import { formatNumberWithCommas, formatTrimmedNumber } from '../../shared/utils/number'
import { useToast } from '../../shared/ui/Toast'

const PLATFORMS = [
  { id: 'cafe24', label: '카페24', rate: 0.035 },
  { id: 'smartstore', label: '스마트스토어', rate: 0.055 },
] as const

const TARGET_MARGINS = [0.05, 0.1, 0.15, 0.2] as const

type PlatformId = (typeof PLATFORMS)[number]['id']

type PlatformFeeCalculatorProps = {
  onAddHistory: (entry: HistoryWriteInput) => void
  selectedHistory?: HistoryItem | null
}

export default function PlatformFeeCalculator({
  onAddHistory,
  selectedHistory,
}: PlatformFeeCalculatorProps) {
  const [platform, setPlatform] = useState<PlatformId>('cafe24')
  const [cost, setCost] = useState('')
  const { push } = useToast()

  useEffect(() => {
    if (selectedHistory?.type === 'platform') {
      const input = selectedHistory.input as Record<string, string>
      const nextPlatform = String(input.platform ?? 'cafe24') as PlatformId
      setPlatform(nextPlatform)
      setCost(String(input.cost ?? ''))
    }
  }, [selectedHistory])

  const selected = useMemo(
    () => PLATFORMS.find((item) => item.id === platform) ?? PLATFORMS[0],
    [platform],
  )

  const parsedCost = useMemo(() => {
    const cleaned = cost.replace(/[^\d]/g, '')
    const numeric = Number(cleaned)
    return {
      cleaned,
      value: Number.isFinite(numeric) ? numeric : NaN,
    }
  }, [cost])

  const rateLabel = `${formatTrimmedNumber(selected.rate * 100)}%`

  const marginResults = useMemo(() => {
    if (!parsedCost.cleaned || !(parsedCost.value > 0)) {
      return null
    }

    return TARGET_MARGINS.map((margin) => {
      const denom = (1 - selected.rate) - margin
      if (denom <= 0) {
        return { margin, value: null, label: '계산 불가' }
      }
      const price = parsedCost.value / denom
      const rounded = Math.round(price)
      return {
        margin,
        value: rounded,
        label: `${formatNumberWithCommas(rounded)}원`,
      }
    })
  }, [parsedCost, selected.rate])

  const recordText = useMemo(() => {
    if (!marginResults) return ''
    const header = `플랫폼: ${selected.label}\n수수료율: ${rateLabel}\n원가: ${formatNumberWithCommas(parsedCost.value)}원`
    const lines = marginResults.map((row) => {
      const percent = formatTrimmedNumber(row.margin * 100)
      return `마진 ${percent}%: ${row.label}`
    })
    return `${header}\n${lines.join('\n')}`
  }, [marginResults, parsedCost.value, rateLabel, selected.label])

  const handleSave = () => {
    if (!marginResults) return
    onAddHistory({
      type: 'platform',
      title: '플랫폼 수수료',
      input: { platform, cost: parsedCost.cleaned },
      output: {
        summary: recordText.replace(/\n/g, ' | '),
        copyValue: recordText,
      },
    })
    push('기록에 저장했어요')
  }

  const handleCopy = async () => {
    if (!recordText) return
    await navigator.clipboard.writeText(recordText)
    push('복사됨')
  }

  return (
    <section className="tool-card" aria-label="플랫폼 수수료 계산기">
      <div className="tool-header">
        <h2>플랫폼 수수료 계산기</h2>
        <p>카페24 / 스마트스토어 수수료를 빠르게 계산합니다.</p>
      </div>
      <div className="fee-grid">
        <label>
          플랫폼 선택
          <select
            value={platform}
            onChange={(event) => setPlatform(event.target.value as PlatformId)}
            aria-label="플랫폼 선택"
          >
            {PLATFORMS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          원가 입력(원)
          <input
            value={parsedCost.cleaned}
            onChange={(event) => setCost(event.target.value.replace(/[^\d]/g, ''))}
            aria-label="원가 입력"
            placeholder="예: 10000"
            inputMode="numeric"
          />
        </label>
        <div className="fee-output">
          {!marginResults ? (
            <div className="fee-value">원가를 입력해 주세요</div>
          ) : (
            <>
              <div>
                <div className="fee-label">선택한 플랫폼</div>
                <div className="fee-value">{selected.label}</div>
              </div>
              <div>
                <div className="fee-label">적용 수수료율</div>
                <div className="fee-value">{rateLabel}</div>
              </div>
              <div>
                <div className="fee-label">목표 마진별 권장 판매가</div>
                <div className="fee-table">
                  {marginResults.map((row) => {
                    const percent = formatTrimmedNumber(row.margin * 100)
                    return (
                      <div key={row.margin} className="fee-row">
                        <span>{percent}%</span>
                        <span>{row.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="fee-actions">
          <button type="button" className="primary" onClick={handleSave}>
            기록 저장
          </button>
          <button type="button" onClick={handleCopy}>
            결과 복사
          </button>
        </div>
      </div>
    </section>
  )
}
