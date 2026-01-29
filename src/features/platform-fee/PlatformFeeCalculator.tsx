import { useEffect, useMemo, useState } from 'react'
import type { HistoryItem, HistoryWriteInput } from '../history/types'
import { formatNumberWithCommas, formatTrimmedNumber } from '../../shared/utils/number'
import { useToast } from '../../shared/ui/Toast'

const PLATFORMS = [
  { id: 'cafe24', label: '카페24', rate: 0.035 },
  { id: 'smartstore', label: '스마트스토어', rate: 0.055 },
] as const

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
  const [price, setPrice] = useState('')
  const { push } = useToast()

  useEffect(() => {
    if (selectedHistory?.type === 'platform') {
      const input = selectedHistory.input as Record<string, string>
      const nextPlatform = String(input.platform ?? 'cafe24') as PlatformId
      setPlatform(nextPlatform)
      setPrice(String(input.price ?? ''))
    }
  }, [selectedHistory])

  const selected = useMemo(
    () => PLATFORMS.find((item) => item.id === platform) ?? PLATFORMS[0],
    [platform],
  )

  const fee = useMemo(() => {
    const numeric = Number(price)
    if (!Number.isFinite(numeric)) return ''
    const value = numeric * selected.rate
    return formatNumberWithCommas(value)
  }, [price, selected.rate])

  const rateLabel = `${formatTrimmedNumber(selected.rate * 100)}%`

  const handleSave = () => {
    if (!fee) return
    onAddHistory({
      type: 'platform',
      title: '플랫폼 수수료',
      input: { platform, price },
      output: {
        summary: `${selected.label} ${rateLabel} → ${fee}원`,
        copyValue: fee,
      },
    })
    push('기록에 저장했어요')
  }

  const handleCopy = async () => {
    if (!fee) return
    await navigator.clipboard.writeText(fee)
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
          판매가 입력(원)
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            aria-label="판매가 입력"
            placeholder="예: 10000"
          />
        </label>
        <div className="fee-output">
          <div>
            <div className="fee-label">선택한 플랫폼</div>
            <div className="fee-value">{selected.label}</div>
          </div>
          <div>
            <div className="fee-label">적용 수수료율</div>
            <div className="fee-value">{rateLabel}</div>
          </div>
          <div>
            <div className="fee-label">수수료 금액(원)</div>
            <div className="fee-value">{fee}</div>
          </div>
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
