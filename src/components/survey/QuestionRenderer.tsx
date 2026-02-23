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

export function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
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
          <span className="flex-1 text-sm">{option}</span>
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
          최대 {question.maxSelections}개 선택 가능 ({value.length}/{question.maxSelections})
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
            <span className={`flex-1 text-sm ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
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

  // 1-6 척도에서 6은 "해당없음/모름"으로 분리 표시
  const hasNA = max === 6;
  const scaleMax = hasNA ? 5 : max;
  const scalePoints = Array.from({ length: scaleMax - min + 1 }, (_, i) => min + i);

  return (
    <div className="space-y-4">
      {/* 척도 라벨 */}
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>{question.scaleMinLabel || '매우 불만족'}</span>
        <span>{hasNA ? '매우 만족' : (question.scaleMaxLabel || max)}</span>
      </div>

      {/* 1~5 척도 버튼 */}
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

      {/* 해당없음/모름 분리 버튼 */}
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
            해당없음 / 모름
          </button>
        </div>
      )}

      {/* 선택 표시 제거됨 */}
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
      placeholder="답변을 입력해 주세요"
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
      placeholder="자유롭게 작성해 주세요"
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
      // Already selected — remove it (and shift others up)
      onChange(value.filter((v) => v !== option));
    } else if (value.length < maxRank) {
      // Not yet at max — add it
      onChange([...value, option]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>선택한 순서대로 순위가 매겨집니다.</span>
        <span className="font-medium text-blue-600">
          {value.length} / {maxRank}순위 선택됨
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
            <span className={isSelected ? 'font-medium text-blue-900' : ''}>{option}</span>
          </button>
        );
      })}
    </div>
  );
}
