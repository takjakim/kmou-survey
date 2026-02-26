'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  KMOU_SURVEY_QUESTIONS,
  SURVEY_SECTIONS,
  type SurveyQuestion,
} from '@/data/kmou-questions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Submission {
  id: string;
  responses: Record<string, string | string[] | number | Record<string, number>>;
  language: string;
  status: string;
  submitted_at: string;
}

type TabId = 'overview' | 'responses' | 'statistics';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PASSWORD = 'kmou2025admin';
const SESSION_KEY = 'kmou_admin_auth';

const questionMap = new Map<string, SurveyQuestion>();
KMOU_SURVEY_QUESTIONS.forEach((q) => questionMap.set(q.id, q));

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateOnly(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function truncateId(id: string) {
  return id.length > 8 ? id.slice(0, 8) + '...' : id;
}

function getResponseValue(val: unknown): string {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') {
    // ranking responses: { "option": rank_number }
    const entries = Object.entries(val as Record<string, number>);
    if (entries.length === 0) return '-';
    return entries
      .sort(([, a], [, b]) => a - b)
      .map(([option, rank]) => `${rank}위: ${option}`)
      .join(', ');
  }
  return String(val);
}

function pct(count: number, total: number): string {
  if (total === 0) return '0';
  return ((count / total) * 100).toFixed(1);
}

// ---------------------------------------------------------------------------
// Password Gate
// ---------------------------------------------------------------------------

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      onAuth();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-lg">관리자 로그인</CardTitle>
          <CardDescription className="text-center">
            KMOU 설문 관리 페이지
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setError(false);
              }}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500">비밀번호가 올바르지 않습니다.</p>
            )}
            <Button type="submit" className="w-full">
              로그인
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

function OverviewTab({ submissions }: { submissions: Submission[] }) {
  const complete = submissions.filter((s) => s.status === 'complete');
  const partial = submissions.filter((s) => s.status === 'partial');

  // Date trend
  const dateCounts = useMemo(() => {
    const map = new Map<string, { complete: number; partial: number }>();
    submissions.forEach((s) => {
      const day = formatDateOnly(s.submitted_at);
      const entry = map.get(day) || { complete: 0, partial: 0 };
      if (s.status === 'complete') entry.complete++;
      else entry.partial++;
      map.set(day, entry);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [submissions]);

  // Demographics - only from complete submissions
  const demographics = useMemo(() => {
    const affiliation: Record<string, number> = {};
    const program: Record<string, number> = {};
    const gender: Record<string, number> = {};

    complete.forEach((s) => {
      const aff = s.responses['B-1-1'];
      if (typeof aff === 'string' && aff) {
        affiliation[aff] = (affiliation[aff] || 0) + 1;
      }
      const prog = s.responses['B-1-3'];
      if (typeof prog === 'string' && prog) {
        program[prog] = (program[prog] || 0) + 1;
      }
      const gen = s.responses['B-1-5'];
      if (typeof gen === 'string' && gen) {
        gender[gen] = (gender[gen] || 0) + 1;
      }
    });

    return { affiliation, program, gender };
  }, [complete]);

  const total = complete.length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>전체 응답</CardDescription>
            <CardTitle className="text-3xl">{submissions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              완료 {complete.length} / 임시저장 {partial.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>완료된 응답</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {complete.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {pct(complete.length, submissions.length)}% 완료율
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>임시저장</CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              {partial.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {pct(partial.length, submissions.length)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Date trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">일별 응답 현황</CardTitle>
        </CardHeader>
        <CardContent>
          {dateCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4 font-medium">날짜</th>
                    <th className="py-2 pr-4 font-medium text-right">완료</th>
                    <th className="py-2 pr-4 font-medium text-right">임시저장</th>
                    <th className="py-2 font-medium text-right">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {dateCounts.map(([day, counts]) => (
                    <tr key={day} className="border-b last:border-0">
                      <td className="py-2 pr-4">{day}</td>
                      <td className="py-2 pr-4 text-right">{counts.complete}</td>
                      <td className="py-2 pr-4 text-right">{counts.partial}</td>
                      <td className="py-2 text-right font-medium">
                        {counts.complete + counts.partial}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DemoCard title="소속 분포" data={demographics.affiliation} total={total} />
        <DemoCard title="과정 분포" data={demographics.program} total={total} />
        <DemoCard title="성별 분포" data={demographics.gender} total={total} />
      </div>
    </div>
  );
}

function DemoCard({
  title,
  data,
  total,
}: {
  title: string;
  data: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>완료 응답 기준 (n={total})</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {entries.map(([label, count]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="truncate mr-2">{label}</span>
                <span className="font-medium whitespace-nowrap">
                  {count} ({pct(count, total)}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Responses Tab
// ---------------------------------------------------------------------------

function ResponsesTab({ submissions }: { submissions: Submission[] }) {
  const [filter, setFilter] = useState<'all' | 'complete' | 'partial'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return submissions;
    return submissions.filter((s) => s.status === filter);
  }, [submissions, filter]);

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'complete', 'partial'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '전체' : f === 'complete' ? '완료' : '임시저장'} (
            {f === 'all'
              ? submissions.length
              : submissions.filter((s) => s.status === f).length}
            )
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="p-3 font-medium">ID</th>
                  <th className="p-3 font-medium">소속</th>
                  <th className="p-3 font-medium">학과</th>
                  <th className="p-3 font-medium">과정</th>
                  <th className="p-3 font-medium">언어</th>
                  <th className="p-3 font-medium">상태</th>
                  <th className="p-3 font-medium">제출일시</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      응답 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <ResponseRow
                      key={s.id}
                      submission={s}
                      isExpanded={expandedId === s.id}
                      onToggle={() =>
                        setExpandedId(expandedId === s.id ? null : s.id)
                      }
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResponseRow({
  submission: s,
  isExpanded,
  onToggle,
}: {
  submission: Submission;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="p-3 font-mono text-xs">{truncateId(s.id)}</td>
        <td className="p-3">{getResponseValue(s.responses['B-1-1'])}</td>
        <td className="p-3">{getResponseValue(s.responses['B-1-2'])}</td>
        <td className="p-3">{getResponseValue(s.responses['B-1-3'])}</td>
        <td className="p-3">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs">
            {s.language === 'ko' ? '한국어' : 'English'}
          </span>
        </td>
        <td className="p-3">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              s.status === 'complete'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {s.status === 'complete' ? '완료' : '임시저장'}
          </span>
        </td>
        <td className="p-3 whitespace-nowrap">{formatDate(s.submitted_at)}</td>
      </tr>
      {isExpanded && (
        <tr className="bg-blue-50/50">
          <td colSpan={7} className="p-4">
            <ResponseDetail submission={s} />
          </td>
        </tr>
      )}
    </>
  );
}

function ResponseDetail({ submission }: { submission: Submission }) {
  // Group answers by part
  const parts = ['A', 'B', 'C'] as const;

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="text-xs text-muted-foreground mb-2">
        전체 ID: {submission.id}
      </div>
      {parts.map((part) => {
        const partQuestions = KMOU_SURVEY_QUESTIONS.filter((q) => q.part === part);
        const answeredQuestions = partQuestions.filter(
          (q) => submission.responses[q.id] !== undefined && submission.responses[q.id] !== null
        );
        if (answeredQuestions.length === 0) return null;

        return (
          <div key={part}>
            <h4 className="font-semibold text-sm mb-2 text-blue-700">
              Part {part}
              {part === 'A'
                ? ': 비교과 프로그램 만족도 및 수요조사'
                : part === 'B'
                ? ': 대학원 교육 및 연구환경 만족도 조사'
                : ': 커피 기프티콘 수령 정보'}
            </h4>
            <div className="space-y-1.5">
              {answeredQuestions.map((q) => (
                <div
                  key={q.id}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 text-sm py-1 border-b border-slate-100 last:border-0"
                >
                  <span className="text-muted-foreground">
                    [{q.id}] {q.title}
                  </span>
                  <span className="font-medium break-words">
                    {getResponseValue(submission.responses[q.id])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Statistics Tab
// ---------------------------------------------------------------------------

function StatisticsTab({ submissions }: { submissions: Submission[] }) {
  const complete = useMemo(
    () => submissions.filter((s) => s.status === 'complete'),
    [submissions]
  );

  // Group questions by section
  const sectionGroups = useMemo(() => {
    const groups: { section: (typeof SURVEY_SECTIONS)[0]; questions: SurveyQuestion[] }[] = [];
    SURVEY_SECTIONS.forEach((sec) => {
      const questions = KMOU_SURVEY_QUESTIONS.filter(
        (q) => q.section === sec.id && (q.type === 'scale' || q.type === 'radio' || q.type === 'checkbox' || q.type === 'ranking')
      );
      if (questions.length > 0) {
        groups.push({ section: sec, questions });
      }
    });
    return groups;
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        완료된 응답 기준 (n={complete.length})
      </p>
      {sectionGroups.map(({ section, questions }) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle className="text-base">
              [{section.id}] {section.title}
            </CardTitle>
            <CardDescription>Part {section.part}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((q) => (
              <QuestionStat key={q.id} question={q} submissions={complete} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuestionStat({
  question: q,
  submissions,
}: {
  question: SurveyQuestion;
  submissions: Submission[];
}) {
  if (q.type === 'scale') {
    return <ScaleStat question={q} submissions={submissions} />;
  }
  if (q.type === 'ranking') {
    return <RankingStat question={q} submissions={submissions} />;
  }
  // radio or checkbox
  return <OptionStat question={q} submissions={submissions} />;
}

function ScaleStat({
  question: q,
  submissions,
}: {
  question: SurveyQuestion;
  submissions: Submission[];
}) {
  const max = q.scaleMax || 5;
  const hasNA = max === 6; // 6 = "해당없음/모름"

  const stats = useMemo(() => {
    const dist: Record<number, number> = {};
    for (let i = (q.scaleMin || 1); i <= max; i++) dist[i] = 0;

    let sum = 0;
    let count = 0;

    submissions.forEach((s) => {
      const val = s.responses[q.id];
      if (typeof val === 'number') {
        dist[val] = (dist[val] || 0) + 1;
        // Exclude "해당없음" (6) from average
        if (!(hasNA && val === 6)) {
          sum += val;
          count++;
        }
      } else if (typeof val === 'string') {
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
          dist[num] = (dist[num] || 0) + 1;
          if (!(hasNA && num === 6)) {
            sum += num;
            count++;
          }
        }
      }
    });

    const avg = count > 0 ? (sum / count).toFixed(2) : '-';
    const responded = Object.values(dist).reduce((a, b) => a + b, 0);
    return { dist, avg, responded, count };
  }, [submissions, q, max, hasNA]);

  const effectiveMax = hasNA ? 5 : max;

  return (
    <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
        <span className="text-sm font-medium">
          [{q.id}] {q.title}
        </span>
        <span className="text-sm font-bold text-blue-600">
          평균: {stats.avg} / {effectiveMax} (n={stats.count})
        </span>
      </div>
      <div className="flex gap-1 flex-wrap text-xs">
        {Array.from({ length: max - (q.scaleMin || 1) + 1 }, (_, i) => i + (q.scaleMin || 1)).map(
          (val) => {
            const count = stats.dist[val] || 0;
            const barPct = stats.responded > 0 ? (count / stats.responded) * 100 : 0;
            const label =
              hasNA && val === 6
                ? '해당없음'
                : val === (q.scaleMin || 1)
                ? `${val}(${q.scaleMinLabel || ''})`
                : val === effectiveMax
                ? `${val}(${q.scaleMaxLabel || ''})`
                : String(val);
            return (
              <div key={val} className="flex-1 min-w-[60px]">
                <div className="text-center text-muted-foreground mb-1">
                  {label}
                </div>
                <div className="bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      hasNA && val === 6 ? 'bg-gray-400' : 'bg-blue-500'
                    }`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <div className="text-center mt-0.5">
                  {count} ({pct(count, stats.responded)}%)
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

function OptionStat({
  question: q,
  submissions,
}: {
  question: SurveyQuestion;
  submissions: Submission[];
}) {
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    (q.options || []).forEach((opt) => (counts[opt] = 0));

    let responded = 0;

    submissions.forEach((s) => {
      const val = s.responses[q.id];
      if (val === undefined || val === null) return;
      responded++;

      if (Array.isArray(val)) {
        val.forEach((v) => {
          counts[v] = (counts[v] || 0) + 1;
        });
      } else if (typeof val === 'string') {
        counts[val] = (counts[val] || 0) + 1;
      }
    });

    return { counts, responded };
  }, [submissions, q]);

  const entries = Object.entries(stats.counts).sort(([, a], [, b]) => b - a);
  const maxCount = Math.max(...entries.map(([, c]) => c), 1);

  return (
    <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <div className="mb-2">
        <span className="text-sm font-medium">
          [{q.id}] {q.title}
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          ({q.type === 'checkbox' ? '복수응답' : '단일응답'}, n={stats.responded})
        </span>
      </div>
      <div className="space-y-1.5">
        {entries.map(([option, count]) => {
          const barPct = (count / maxCount) * 100;
          const responsePct = stats.responded > 0 ? pct(count, stats.responded) : '0';
          return (
            <div key={option} className="text-sm">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="truncate mr-2">{option}</span>
                <span className="whitespace-nowrap font-medium">
                  {count} ({responsePct}%)
                </span>
              </div>
              <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankingStat({
  question: q,
  submissions,
}: {
  question: SurveyQuestion;
  submissions: Submission[];
}) {
  const rankCount = q.rankingCount || 3;

  const stats = useMemo(() => {
    // Weighted score: 1st = rankCount pts, 2nd = rankCount-1, etc.
    const scores: Record<string, number> = {};
    const rankDist: Record<string, number[]> = {};
    (q.options || []).forEach((opt) => {
      scores[opt] = 0;
      rankDist[opt] = Array(rankCount).fill(0);
    });

    let responded = 0;

    submissions.forEach((s) => {
      const val = s.responses[q.id];
      if (!val || typeof val !== 'object' || Array.isArray(val)) return;
      responded++;

      const ranking = val as Record<string, number>;
      Object.entries(ranking).forEach(([option, rank]) => {
        if (typeof rank === 'number' && rank >= 1 && rank <= rankCount) {
          const weight = rankCount - rank + 1;
          scores[option] = (scores[option] || 0) + weight;
          if (rankDist[option]) {
            rankDist[option][rank - 1] = (rankDist[option][rank - 1] || 0) + 1;
          }
        }
      });
    });

    return { scores, rankDist, responded };
  }, [submissions, q, rankCount]);

  const sorted = Object.entries(stats.scores).sort(([, a], [, b]) => b - a);
  const maxScore = Math.max(...sorted.map(([, s]) => s), 1);

  return (
    <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <div className="mb-2">
        <span className="text-sm font-medium">
          [{q.id}] {q.title}
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          (가중합산, n={stats.responded})
        </span>
      </div>
      <div className="space-y-1.5">
        {sorted.map(([option, score], idx) => {
          const barPct = (score / maxScore) * 100;
          const dist = stats.rankDist[option] || [];
          return (
            <div key={option} className="text-sm">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="truncate mr-2">
                  <span className="font-semibold text-blue-600 mr-1">{idx + 1}.</span>
                  {option}
                </span>
                <span className="whitespace-nowrap font-medium">
                  {score}점
                  <span className="text-muted-foreground ml-1">
                    ({dist.map((d, i) => `${i + 1}위:${d}`).join(' ')})
                  </span>
                </span>
              </div>
              <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Check session on mount
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      setAuthed(true);
    }
  }, []);

  // Fetch data once authenticated
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/responses');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setSubmissions(json.data || []);
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed, fetchData]);

  if (!authed) {
    return <PasswordGate onAuth={() => setAuthed(true)} />;
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: '개요' },
    { id: 'responses', label: '응답 목록' },
    { id: 'statistics', label: '통계' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-blue-700">
              KMOU 설문 관리
            </h1>
            <p className="text-xs text-muted-foreground">
              대학원 종합 설문조사 관리 페이지
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              {loading ? '로딩 중...' : '새로고침'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                sessionStorage.removeItem(SESSION_KEY);
                setAuthed(false);
              }}
            >
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab submissions={submissions} />}
            {activeTab === 'responses' && <ResponsesTab submissions={submissions} />}
            {activeTab === 'statistics' && <StatisticsTab submissions={submissions} />}
          </>
        )}
      </main>
    </div>
  );
}
