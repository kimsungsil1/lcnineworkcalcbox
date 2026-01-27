import { Parser } from 'expr-eval'

const parser = new Parser({
  operators: {
    add: true,
    subtract: true,
    multiply: true,
    divide: true,
    power: false,
    factorial: false,
    logical: false,
    comparison: false,
    in: false,
    assignment: false,
  },
})

export function safeEval(expression: string) {
  const normalized = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/％/g, '%')

  if (!normalized.trim()) {
    throw new Error('empty')
  }

  const result = parser.evaluate(normalized)
  if (!Number.isFinite(result)) {
    throw new Error('division_by_zero')
  }

  return result
}
