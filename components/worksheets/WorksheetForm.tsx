'use client'

import { useState } from 'react'
import { Framework, FrameworkStep } from '@/lib/frameworks'
import { WorksheetAnswers } from '@/types'

interface Props {
  framework: Framework
  answers: WorksheetAnswers
  onChange: (answers: WorksheetAnswers) => void
  readOnly?: boolean
}

export default function WorksheetForm({ framework, answers, onChange, readOnly = false }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-neutral-700">
        {framework.name} ワークシート
      </h3>
      {framework.steps.map((step, i) => (
        <StepField
          key={step.id}
          step={step}
          index={i}
          value={answers[step.id] ?? ''}
          onChange={(val) => onChange({ ...answers, [step.id]: val })}
          readOnly={readOnly}
        />
      ))}
    </div>
  )
}

function StepField({
  step,
  index,
  value,
  onChange,
  readOnly,
}: {
  step: FrameworkStep
  index: number
  value: string
  onChange: (val: string) => void
  readOnly: boolean
}) {
  const [hintsOpen, setHintsOpen] = useState(false)

  return (
    <div className="border border-neutral-200 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
          Step {index + 1} — {step.label}
        </span>
      </div>

      <p className="text-sm font-medium text-neutral-800">{step.question}</p>

      {!readOnly && (
        <textarea
          rows={3}
          placeholder="回答を入力..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
        />
      )}

      {readOnly && value && (
        <p className="text-sm text-neutral-700 whitespace-pre-wrap bg-neutral-50 rounded-lg px-3 py-2">
          {value}
        </p>
      )}

      {readOnly && !value && (
        <p className="text-sm text-neutral-400 italic">未回答</p>
      )}

      {/* Hints accordion */}
      {!readOnly && step.hints.length > 0 && (
        <button
          type="button"
          onClick={() => setHintsOpen(!hintsOpen)}
          className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1 transition"
        >
          <span>{hintsOpen ? '▾' : '▸'}</span>
          言葉が出ないときの深掘り質問 ({step.hints.length}問)
        </button>
      )}

      {hintsOpen && (
        <ul className="space-y-1 pl-3 border-l-2 border-neutral-200">
          {step.hints.map((hint, i) => (
            <li key={i} className="text-xs text-neutral-600">
              {hint}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
