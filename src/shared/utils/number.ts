export function formatNumberWithCommas(
  value: number | string,
  maxFractionDigits = 6,
) {
  const numeric = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(numeric)) return String(value)
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFractionDigits,
  }).format(numeric)
}

export function formatTrimmedNumber(value: number, maxFractionDigits = 6) {
  if (!Number.isFinite(value)) return String(value)
  const formatted = value.toFixed(maxFractionDigits)
  return formatted.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

const SMALL_UNITS = ['', '십', '백', '천']
const LARGE_UNITS = [
  { value: 1e12, label: '조' },
  { value: 1e8, label: '억' },
  { value: 1e4, label: '만' },
]
const DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']

function readUnder10000(num: number) {
  let result = ''
  const digits = String(num).padStart(4, '0').split('').map(Number)
  digits.forEach((digit, index) => {
    if (digit === 0) return
    const unit = SMALL_UNITS[3 - index]
    const digitText = digit === 1 && unit ? '' : DIGITS[digit]
    result += `${digitText}${unit}`
  })
  return result || '영'
}

export function numberToKoreanWords(value: number) {
  if (!Number.isFinite(value)) return '알 수 없음'
  if (value === 0) return '영'

  const isNegative = value < 0
  let remaining = Math.floor(Math.abs(value))
  let result = ''

  LARGE_UNITS.forEach((unit) => {
    const chunk = Math.floor(remaining / unit.value)
    if (chunk > 0) {
      result += `${readUnder10000(chunk)}${unit.label}`
      remaining %= unit.value
    }
  })

  if (remaining > 0) {
    result += readUnder10000(remaining)
  }

  return isNegative ? `마이너스 ${result}` : result
}
