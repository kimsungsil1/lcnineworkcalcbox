import { useEffect, useMemo, useState } from 'react'
import type { HistoryItem, HistoryWriteInput } from '../history/types'
import { formatTrimmedNumber } from '../../shared/utils/number'

type UnitDefinition = {
  label: string
  toBase: (value: number) => number
  fromBase: (value: number) => number
}

type Category = {
  label: string
  baseUnit: string
  units: Record<string, UnitDefinition>
  formula?: string
}

const CATEGORIES: Record<string, Category> = {
  length: {
    label: '길이',
    baseUnit: 'm',
    units: {
      mm: { label: 'mm', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      cm: { label: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      m: { label: 'm', toBase: (v) => v, fromBase: (v) => v },
      km: { label: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      inch: { label: 'inch', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      ft: { label: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    },
  },
  area: {
    label: '면적',
    baseUnit: 'm²',
    units: {
      'mm²': { label: 'mm²', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      'cm²': { label: 'cm²', toBase: (v) => v / 1e4, fromBase: (v) => v * 1e4 },
      'm²': { label: 'm²', toBase: (v) => v, fromBase: (v) => v },
      'km²': { label: 'km²', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      평: { label: '평', toBase: (v) => v * 3.3058, fromBase: (v) => v / 3.3058 },
      acre: { label: 'acre', toBase: (v) => v * 4046.8564224, fromBase: (v) => v / 4046.8564224 },
    },
  },
  weight: {
    label: '무게',
    baseUnit: 'kg',
    units: {
      mg: { label: 'mg', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      g: { label: 'g', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      kg: { label: 'kg', toBase: (v) => v, fromBase: (v) => v },
      lb: { label: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
    },
  },
  volume: {
    label: '부피',
    baseUnit: 'L',
    units: {
      mL: { label: 'mL', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      L: { label: 'L', toBase: (v) => v, fromBase: (v) => v },
      'm³': { label: 'm³', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      'fl oz': { label: 'fl oz', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
    },
  },
  temperature: {
    label: '온도',
    baseUnit: '°C',
    units: {
      '°C': { label: '°C', toBase: (v) => v, fromBase: (v) => v },
      '°F': {
        label: '°F',
        toBase: (v) => (v - 32) * (5 / 9),
        fromBase: (v) => v * (9 / 5) + 32,
      },
      K: {
        label: 'K',
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
    },
    formula: '°C ↔ °F = (°C × 9/5) + 32, K = °C + 273.15',
  },
  pressure: {
    label: '압력',
    baseUnit: 'Pa',
    units: {
      Pa: { label: 'Pa', toBase: (v) => v, fromBase: (v) => v },
      kPa: { label: 'kPa', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      bar: { label: 'bar', toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
      psi: { label: 'psi', toBase: (v) => v * 6894.75729, fromBase: (v) => v / 6894.75729 },
      atm: { label: 'atm', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
    },
  },
  speed: {
    label: '속도',
    baseUnit: 'm/s',
    units: {
      'm/s': { label: 'm/s', toBase: (v) => v, fromBase: (v) => v },
      'km/h': { label: 'km/h', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      mph: { label: 'mph', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
    },
  },
}

type UnitConverterProps = {
  onAddHistory: (entry: HistoryWriteInput) => void
  selectedHistory?: HistoryItem | null
}

export default function UnitConverter({
  onAddHistory,
  selectedHistory,
}: UnitConverterProps) {
  const [categoryKey, setCategoryKey] = useState('length')
  const [fromUnit, setFromUnit] = useState('m')
  const [toUnit, setToUnit] = useState('cm')
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (selectedHistory?.type === 'unit') {
      const input = selectedHistory.input as Record<string, string>
      setCategoryKey(String(input.category ?? 'length'))
      setFromUnit(String(input.fromUnit ?? 'm'))
      setToUnit(String(input.toUnit ?? 'cm'))
      setInputValue(String(input.inputValue ?? ''))
    }
  }, [selectedHistory])

  useEffect(() => {
    const category = CATEGORIES[categoryKey]
    if (!category) return
    const units = Object.keys(category.units)
    if (!units.includes(fromUnit)) {
      setFromUnit(units[0])
    }
    if (!units.includes(toUnit)) {
      setToUnit(units[1] ?? units[0])
    }
  }, [categoryKey, fromUnit, toUnit])

  const outputValue = useMemo(() => {
    const category = CATEGORIES[categoryKey]
    if (!category) return ''
    const value = Number(inputValue)
    if (!Number.isFinite(value)) return ''
    const from = category.units[fromUnit]
    const to = category.units[toUnit]
    const baseValue = from.toBase(value)
    const converted = to.fromBase(baseValue)
    return formatTrimmedNumber(converted)
  }, [categoryKey, fromUnit, toUnit, inputValue])

  const formula = useMemo(() => {
    const category = CATEGORIES[categoryKey]
    if (!category) return ''
    if (category.formula) return category.formula
    const from = category.units[fromUnit]
    const to = category.units[toUnit]
    const base = category.baseUnit
    return `1 ${from.label} = ${formatTrimmedNumber(to.fromBase(from.toBase(1)))} ${to.label} (기준: ${base})`
  }, [categoryKey, fromUnit, toUnit])

  const handleSave = () => {
    if (!outputValue) return
    onAddHistory({
      type: 'unit',
      title: '단위 변환',
      input: { category: categoryKey, fromUnit, toUnit, inputValue },
      output: {
        summary: `${inputValue || 0} ${fromUnit} → ${outputValue} ${toUnit}`,
        copyValue: outputValue,
      },
    })
  }

  const category = CATEGORIES[categoryKey]
  const unitKeys = Object.keys(category.units)

  return (
    <section className="tool-card" aria-label="단위 변환">
      <div className="tool-header">
        <h2>단위 변환</h2>
        <p>업무에 필요한 주요 단위를 빠르게 변환하세요.</p>
      </div>
      <div className="unit-grid">
        <label>
          카테고리
          <select
            value={categoryKey}
            onChange={(event) => setCategoryKey(event.target.value)}
            aria-label="카테고리"
          >
            {Object.entries(CATEGORIES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          기준 단위
          <select
            value={fromUnit}
            onChange={(event) => setFromUnit(event.target.value)}
            aria-label="기준 단위"
          >
            {unitKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
        <label>
          변환 단위
          <select
            value={toUnit}
            onChange={(event) => setToUnit(event.target.value)}
            aria-label="변환 단위"
          >
            {unitKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
        <label>
          값
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            aria-label="변환 값"
          />
        </label>
        <div className="unit-output">
          <div className="unit-value">{outputValue}</div>
          <div className="unit-formula">{formula}</div>
        </div>
        <button type="button" className="primary" onClick={handleSave}>
          기록 저장
        </button>
      </div>
    </section>
  )
}
