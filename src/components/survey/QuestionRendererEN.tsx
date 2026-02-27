'use client';

import { type SurveyQuestion } from '@/data/kmou-questions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface QuestionRendererProps {
  question: SurveyQuestion;
  value: string | string[] | number | null | undefined;
  onChange: (value: string | string[] | number) => void;
}

export function QuestionRendererEN({ question, value, onChange }: QuestionRendererProps) {
  switch (question.type) {
    case 'radio':
      return <RadioQuestion question={question} value={value as string} onChange={onChange} />;
    case 'checkbox':
      return <CheckboxQuestion question={question} value={(value as string[]) || []} onChange={onChange} />;
    case 'scale':
      return <ScaleQuestion question={question} value={value as number} onChange={onChange} />;
    case 'text':
      return <TextQuestion question={question} value={(value as string) || ''} onChange={onChange} />;
    case 'paragraph':
      return <ParagraphQuestion question={question} value={(value as string) || ''} onChange={onChange} />;
    case 'ranking':
      return <RankingQuestion question={question} value={(value as string[]) || []} onChange={onChange} />;
    default:
      return null;
  }
}

function RadioQuestion({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <RadioGroup value={value || ''} onValueChange={onChange} className="space-y-3">
      {question.options?.map((option) => (
        <label
          key={option}
          htmlFor={`${question.id}-${option}`}
          className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
            value === option ? 'bg-blue-50 border-blue-300' : 'hover:bg-slate-50 border-transparent border-gray-200'
          }`}
        >
          <RadioGroupItem value={option} id={`${question.id}-${option}`} />
          <span className="flex-1 text-sm break-keep">{option}</span>
        </label>
      ))}
    </RadioGroup>
  );
}

function CheckboxQuestion({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const handleToggle = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter((v) => v !== option)
      : [...value, option];

    // Enforce maxSelections
    if (question.maxSelections && newValue.length > question.maxSelections) {
      return;
    }

    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      {question.maxSelections && (
        <p className="text-sm text-muted-foreground">
          Select up to {question.maxSelections} ({value.length}/{question.maxSelections})
        </p>
      )}
      {question.options?.map((option) => {
        const isChecked = value.includes(option);
        const isDisabled = !isChecked && !!question.maxSelections && value.length >= question.maxSelections;

        return (
          <div
            key={option}
            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer select-none ${
              isChecked ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isDisabled && handleToggle(option)}
          >
            <Checkbox
              checked={isChecked}
              disabled={isDisabled}
              className="pointer-events-none"
            />
            <span className={`flex-1 text-sm break-keep ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              {option}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ScaleQuestion({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: number | undefined;
  onChange: (value: number) => void;
}) {
  const min = question.scaleMin || 1;
  const max = question.scaleMax || 5;

  // 1-6 scale where 6 is "N/A / Don't know" shown separately
  const hasNA = max === 6;
  const scaleMax = hasNA ? 5 : max;
  const scalePoints = Array.from({ length: scaleMax - min + 1 }, (_, i) => min + i);

  return (
    <div className="space-y-4">
      {/* Scale labels */}
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>{question.scaleMinLabel || 'Very dissatisfied'}</span>
        <span>{hasNA ? 'Very satisfied' : (question.scaleMaxLabel || max)}</span>
      </div>

      {/* 1~5 scale buttons */}
      <div className="flex justify-center gap-2 flex-wrap">
        {scalePoints.map((point) => (
          <button
            key={point}
            onClick={() => onChange(point)}
            className={`w-12 h-12 rounded-full border-2 text-sm font-medium transition-all ${
              value === point
                ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-md'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            {point}
          </button>
        ))}
      </div>

      {/* N/A / Don't know separate button */}
      {hasNA && (
        <div className="flex justify-center pt-2 border-t border-dashed border-gray-200 mt-2">
          <button
            onClick={() => onChange(6)}
            className={`px-5 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
              value === 6
                ? 'bg-gray-600 border-gray-600 text-white shadow-md'
                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            N/A / Don't know
          </button>
        </div>
      )}
    </div>
  );
}

function TextQuestion({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Please enter your answer"
      className="w-full"
    />
  );
}

function ParagraphQuestion({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Please share your thoughts"
      rows={5}
      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    />
  );
}

function RankingQuestion({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const maxRank = question.rankingCount || 3;

  const handleClick = (option: string) => {
    const currentIndex = value.indexOf(option);

    if (currentIndex !== -1) {
      // Already selected -- remove it (and shift others up)
      onChange(value.filter((v) => v !== option));
    } else if (value.length < maxRank) {
      // Not yet at max -- add it
      onChange([...value, option]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>Items are ranked in the order you select them.</span>
        <span className="font-medium text-blue-600">
          {value.length} / {maxRank} ranks selected
        </span>
      </div>
      {question.options?.map((option) => {
        const rank = value.indexOf(option);
        const isSelected = rank !== -1;
        const isDisabled = !isSelected && value.length >= maxRank;

        return (
          <button
            key={option}
            type="button"
            onClick={() => !isDisabled && handleClick(option)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left text-sm transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : isDisabled
                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-slate-50 cursor-pointer'
            }`}
          >
            {/* Rank badge */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                isSelected
                  ? rank === 0
                    ? 'bg-blue-600 text-white'
                    : rank === 1
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-400 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isSelected ? rank + 1 : '-'}
            </div>
            <span className={`break-keep ${isSelected ? 'font-medium text-blue-900' : ''}`}>{option}</span>
          </button>
        );
      })}
    </div>
  );
}

// --- ScaleMatrixRendererEN ---

interface ScaleMatrixProps {
  questions: SurveyQuestion[];
  values: Record<string, number | undefined>;
  onChange: (questionId: string, value: number) => void;
  validationErrors?: Record<string, string>;
}

const SCALE_LABELS_EN: Record<number, [string, string]> = {
  1: ['Very', 'Dissatisfied'],
  2: ['', 'Dissatisfied'],
  3: ['', 'Neutral'],
  4: ['', 'Satisfied'],
  5: ['Very', 'Satisfied'],
};

/**
 * Strips a leading ID prefix like "3-1. " or "Q1. " from a question title.
 */
function stripIdPrefix(title: string): string {
  return title.replace(/^[\d\w]+-?[\d\w]*\.\s*/, '').replace(/^\d+\)\s*/, '');
}

export function ScaleMatrixRendererEN({ questions, values, onChange, validationErrors }: ScaleMatrixProps) {
  if (questions.length === 0) return null;

  const firstQ = questions[0];
  const min = firstQ.scaleMin ?? 1;
  const max = firstQ.scaleMax ?? 5;
  const hasNA = max === 6;
  const scaleMax = hasNA ? 5 : max;
  const scalePoints = Array.from({ length: scaleMax - min + 1 }, (_, i) => min + i);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Desktop table layout */}
      <div className="hidden sm:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2 w-auto">Item</th>
              {scalePoints.map((point) => (
                <th
                  key={point}
                  className="text-center text-xs font-medium text-gray-500 px-1 py-2 w-14"
                >
                  <div>{point}</div>
                  {SCALE_LABELS_EN[point] && (
                    <div className="text-gray-400 font-normal leading-tight mt-0.5">
                      {SCALE_LABELS_EN[point][0] && <div>{SCALE_LABELS_EN[point][0]}</div>}
                      <div>{SCALE_LABELS_EN[point][1]}</div>
                    </div>
                  )}
                </th>
              ))}
              {hasNA && (
                <th className="text-center text-xs font-medium text-gray-500 px-2 py-2 w-20">
                  N/A
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {questions.map((question, idx) => {
              const currentValue = values[question.id];
              const hasError = validationErrors?.[question.id];
              const isEven = idx % 2 === 0;

              return (
                <tr
                  key={question.id}
                  className={`border-b border-gray-100 last:border-b-0 transition-colors ${
                    isEven ? 'bg-white' : 'bg-gray-50/50'
                  } ${hasError ? 'bg-red-50/40' : ''}`}
                >
                  <td className="px-4 py-2.5">
                    <span className={`text-sm break-keep leading-snug ${hasError ? 'text-red-700' : 'text-gray-800'}`}>
                      {stripIdPrefix(question.title)}
                    </span>
                    {hasError && (
                      <span className="block text-xs text-red-500 mt-0.5">{hasError}</span>
                    )}
                  </td>
                  {scalePoints.map((point) => {
                    const isSelected = currentValue === point;
                    return (
                      <td key={point} className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => onChange(question.id, point)}
                          aria-label={`${question.title} - ${SCALE_LABELS_EN[point]?.join(' ').trim() ?? point} points`}
                          className={`w-9 h-9 rounded-full border-2 text-sm font-medium transition-all mx-auto block ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm scale-110'
                              : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          {point}
                        </button>
                      </td>
                    );
                  })}
                  {hasNA && (
                    <td className="px-2 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => onChange(question.id, 6)}
                        aria-label={`${question.title} - N/A`}
                        className={`px-2 py-1.5 rounded-lg border-2 text-xs font-medium transition-all mx-auto block whitespace-nowrap ${
                          currentValue === 6
                            ? 'bg-gray-600 border-gray-600 text-white shadow-sm'
                            : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        N/A
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked layout */}
      <div className="sm:hidden divide-y divide-gray-200">
        {questions.map((question, idx) => {
          const currentValue = values[question.id];
          const hasError = validationErrors?.[question.id];
          const isEven = idx % 2 === 0;

          return (
            <div
              key={question.id}
              className={`px-4 py-4 ${isEven ? 'bg-white' : 'bg-gray-50/50'} ${hasError ? 'bg-red-50/40' : ''}`}
            >
              <p className={`text-sm break-keep mb-3 leading-relaxed font-medium ${hasError ? 'text-red-700' : 'text-gray-800'}`}>
                {stripIdPrefix(question.title)}
              </p>
              {hasError && (
                <p className="text-xs text-red-500 mb-1.5">{hasError}</p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {scalePoints.map((point) => {
                  const isSelected = currentValue === point;
                  return (
                    <button
                      key={point}
                      type="button"
                      onClick={() => onChange(question.id, point)}
                      aria-label={`${SCALE_LABELS_EN[point]?.join(' ').trim() ?? point} points`}
                      className={`w-11 h-11 rounded-full border-2 text-sm font-medium transition-all flex-shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm scale-110'
                          : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      {point}
                    </button>
                  );
                })}
                {hasNA && (
                  <button
                    type="button"
                    onClick={() => onChange(question.id, 6)}
                    aria-label="N/A"
                    className={`px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all flex-shrink-0 ${
                      currentValue === 6
                        ? 'bg-gray-600 border-gray-600 text-white shadow-sm'
                        : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    N/A
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
