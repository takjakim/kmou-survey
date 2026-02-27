'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { KMOU_SURVEY_QUESTIONS, SURVEY_SECTIONS, type SurveyQuestion } from '@/data/kmou-questions';
import { useSurveyStore } from '@/store/surveyStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QuestionRenderer, ScaleMatrixRenderer } from '@/components/survey/QuestionRenderer';
import { ChevronLeft, ChevronRight, Send, AlertCircle } from 'lucide-react';

const PAGE_SIZE = 5;

interface SurveyPage {
  questions: SurveyQuestion[];
  section: string;
  sectionTitle: string;
  part: 'A' | 'B' | 'C';
  isMatrix?: boolean;
}

/**
 * Group questions into pages of ~PAGE_SIZE, splitting by:
 * 1. Part boundary (always new page)
 * 2. Section boundary (always new page)
 * 3. Consecutive scale questions with the same scale range → single matrix page
 * 4. "Big" questions (ranking, paragraph, checkbox with many options) get their own page
 * 5. Within a section, chunk remaining questions by PAGE_SIZE
 */
function buildPages(questions: SurveyQuestion[]): SurveyPage[] {
  const pages: SurveyPage[] = [];
  let currentBatch: SurveyQuestion[] = [];
  let scaleBatch: SurveyQuestion[] = [];
  let currentSection = '';
  let currentPart = '';
  let currentScaleKey = ''; // "min-max" key to detect scale range changes

  const flushBatch = () => {
    if (currentBatch.length === 0) return;
    const first = currentBatch[0];
    pages.push({
      questions: [...currentBatch],
      section: first.section,
      sectionTitle: first.sectionTitle,
      part: first.part,
    });
    currentBatch = [];
  };

  const flushScale = () => {
    if (scaleBatch.length === 0) return;
    const first = scaleBatch[0];
    if (scaleBatch.length >= 3) {
      pages.push({
        questions: [...scaleBatch],
        section: first.section,
        sectionTitle: first.sectionTitle,
        part: first.part,
        isMatrix: true,
      });
    } else {
      // Small scale runs fall into the normal batch
      currentBatch.push(...scaleBatch);
      // Flush if over PAGE_SIZE
      while (currentBatch.length >= PAGE_SIZE) {
        const chunk = currentBatch.splice(0, PAGE_SIZE);
        const f = chunk[0];
        pages.push({ questions: chunk, section: f.section, sectionTitle: f.sectionTitle, part: f.part });
      }
    }
    scaleBatch = [];
    currentScaleKey = '';
  };

  for (const q of questions) {
    // Part or section change → flush everything
    if (q.part !== currentPart || q.section !== currentSection) {
      flushScale();
      flushBatch();
      currentPart = q.part;
      currentSection = q.section;
    }

    // "Big" question types get their own page
    const isBig = q.type === 'ranking' || q.type === 'paragraph' ||
      (q.type === 'checkbox' && (q.options?.length || 0) > 6);

    if (isBig) {
      flushScale();
      flushBatch();
      pages.push({
        questions: [q],
        section: q.section,
        sectionTitle: q.sectionTitle,
        part: q.part,
      });
      continue;
    }

    // Scale questions: accumulate into scale run if same range
    if (q.type === 'scale') {
      const scaleKey = `${q.scaleMin ?? 1}-${q.scaleMax ?? 5}`;
      if (scaleBatch.length > 0 && scaleKey !== currentScaleKey) {
        // Range changed — flush current scale run first
        flushScale();
      }
      if (scaleBatch.length === 0) {
        // Starting a new scale run: flush any pending normal batch
        flushBatch();
        currentScaleKey = scaleKey;
      }
      scaleBatch.push(q);
      continue;
    }

    // Non-scale question: flush any open scale run first
    flushScale();

    currentBatch.push(q);

    // Chunk by PAGE_SIZE
    if (currentBatch.length >= PAGE_SIZE) {
      flushBatch();
    }
  }

  flushScale();
  flushBatch();
  return pages;
}

function getSubSectionLabel(questionId: string): string | null {
  const map: Record<string, string> = {
    'B-3-1-1': '교육서비스',
    'B-3-3-1': '교육과정 및 학사관리',
    'B-3-5-1': '교육환경',
    'B-4-1-1': '연구환경',
    'B-4-3-1': '연구수행과 진로탐색',
    'B-4-6-1': '산학협력 활동',
    'B-5-1-1': '진로지원',
  };
  return map[questionId] || null;
}

export default function SurveyPage() {
  const router = useRouter();
  const { responses, setResponse } = useSurveyStore();
  const [pageIndex, setPageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPartTransition, setShowPartTransition] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const submissionIdRef = useRef<string | null>(null);

  // Build pages from ALL questions (including conditional ones)
  const allPages = useMemo(() => buildPages(KMOU_SURVEY_QUESTIONS), []);

  // Check if a conditional question should be visible
  const isQuestionVisible = useCallback((q: SurveyQuestion): boolean => {
    if (!q.conditionalOn) return true;
    const depResponse = responses[q.conditionalOn.questionId];
    if (!depResponse) return false;
    if (Array.isArray(depResponse)) {
      return depResponse.includes(q.conditionalOn.value);
    }
    return depResponse === q.conditionalOn.value;
  }, [responses]);

  // Pages with only visible questions (pages with 0 visible questions are skipped)
  const pages = useMemo(() => {
    return allPages
      .map((page) => ({
        ...page,
        questions: page.questions.filter(isQuestionVisible),
      }))
      .filter((page) => page.questions.length > 0);
  }, [allPages, isQuestionVisible]);

  const activeQuestions = useMemo(() => {
    return KMOU_SURVEY_QUESTIONS.filter(isQuestionVisible);
  }, [isQuestionVisible]);
  const totalPages = pages.length;
  const currentPage = pages[pageIndex];

  // Progress: count answered questions up to current page
  const answeredCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i <= pageIndex && i < pages.length; i++) {
      for (const q of pages[i].questions) {
        const r = responses[q.id];
        if (r !== undefined && r !== null && r !== '' && !(Array.isArray(r) && r.length === 0)) {
          count++;
        }
      }
    }
    return count;
  }, [pages, pageIndex, responses]);

  const totalQuestions = activeQuestions.length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const currentSection = currentPage
    ? SURVEY_SECTIONS.find((s) => s.id === currentPage.section)
    : null;

  const validatePage = useCallback((): boolean => {
    if (!currentPage) return true;
    const errors: Record<string, string> = {};

    for (const q of currentPage.questions) {
      if (!q.required) continue;
      const response = responses[q.id];

      if (response === undefined || response === null || response === '') {
        errors[q.id] = '필수 응답 항목입니다.';
        continue;
      }
      if (Array.isArray(response) && response.length === 0) {
        errors[q.id] = '필수 응답 항목입니다.';
        continue;
      }
      if (q.type === 'ranking' && q.rankingCount) {
        if (!Array.isArray(response) || response.length < q.rankingCount) {
          errors[q.id] = `${q.rankingCount}개를 모두 선택해 주세요.`;
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentPage, responses]);

  const handleNext = useCallback(() => {
    if (!validatePage()) {
      // Scroll to first error
      const firstErrorId = Object.keys(validationErrors)[0];
      if (firstErrorId) {
        document.getElementById(`q-${firstErrorId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setValidationErrors({});

    if (pageIndex < totalPages - 1) {
      const nextPage = pages[pageIndex + 1];
      if (currentPage && nextPage && currentPage.part !== nextPage.part) {
        setShowPartTransition(true);
      } else {
        setPageIndex(pageIndex + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      handleSubmit();
    }
  }, [pageIndex, totalPages, pages, currentPage, validatePage]);

  const handlePrev = useCallback(() => {
    setValidationErrors({});
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pageIndex]);

  const savePartial = useCallback(async () => {
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          id: submissionIdRef.current || undefined,
          status: 'partial',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        submissionIdRef.current = data.id;
      }
    } catch (error) {
      console.error('Partial save error:', error);
    }
  }, [responses]);

  const handlePartTransitionContinue = () => {
    savePartial();
    setShowPartTransition(false);
    setPageIndex(pageIndex + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          id: submissionIdRef.current || undefined,
          status: 'complete',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/complete?id=${data.id}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>설문을 불러오는 중...</p>
      </div>
    );
  }

  // Part transition screen
  if (showPartTransition) {
    const nextPage = pages[pageIndex + 1];
    const nextPart = nextPage?.part;
    const nextPartLabel = nextPart === 'B'
      ? '파트 B: 대학원 교육 및 연구환경 만족도 조사'
      : '파트 C: 추가 정보';
    const nextPartDesc = nextPart === 'B'
      ? '대학원의 교육서비스, 교육과정, 연구환경 등에 대해 평가해 주세요.'
      : '추가 정보를 입력해 주세요.';

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-blue-600">{nextPart}</span>
            </div>
            <CardTitle className="text-xl">{nextPartLabel}</CardTitle>
            <CardDescription className="mt-2">{nextPartDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handlePartTransitionContinue} className="w-full bg-blue-600 hover:bg-blue-700">
              계속하기 <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const partLabel = currentPage.part === 'A'
    ? '파트 A: 비교과 프로그램'
    : currentPage.part === 'B'
      ? '파트 B: 교육 및 연구환경'
      : '파트 C: 추가 정보';

  const isLastPage = pageIndex === totalPages - 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">{partLabel}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% 완료
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      {/* Part B section navigation */}
      {currentPage.part === 'B' && (
        <div className="sticky top-[52px] z-40 bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide" ref={(el) => {
            // Auto-scroll to active section pill
            if (el) {
              const active = el.querySelector('[data-active="true"]');
              if (active) {
                active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
              }
            }
          }}>
            {SURVEY_SECTIONS.filter(s => s.part === 'B').map(section => {
              const isActive = currentPage.section === section.id;
              const sectionPageIndex = pages.findIndex(p => p.section === section.id);
              return (
                <button
                  key={section.id}
                  data-active={isActive}
                  onClick={() => { setPageIndex(sectionPageIndex); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {section.id}: {section.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Section header */}
        {currentSection && (
          <div className="mb-6 pb-4 border-b border-blue-100">
            <h2 className="text-lg font-semibold text-blue-900">
              {currentSection.id}. {currentSection.title}
            </h2>
            {currentSection.description && (
              <p className="text-sm text-muted-foreground mt-1">{currentSection.description}</p>
            )}
          </div>
        )}

        {/* Questions on this page */}
        <div className="space-y-6">
          {currentPage.isMatrix ? (
            <>
              {getSubSectionLabel(currentPage.questions[0].id) && (
                <div className="mb-4 px-1">
                  <h3 className="text-sm font-semibold text-blue-700">
                    {getSubSectionLabel(currentPage.questions[0].id)}
                  </h3>
                </div>
              )}
              <ScaleMatrixRenderer
                questions={currentPage.questions}
                values={Object.fromEntries(
                  currentPage.questions.map(q => [q.id, responses[q.id] as number | undefined])
                )}
                onChange={(qId, val) => {
                  setResponse(qId, val);
                  if (validationErrors[qId]) {
                    setValidationErrors(prev => {
                      const next = { ...prev };
                      delete next[qId];
                      return next;
                    });
                  }
                }}
                validationErrors={validationErrors}
              />
            </>
          ) : (
            currentPage.questions.map((q) => (
              <div key={q.id} id={`q-${q.id}`}>
                <Card className={`shadow-sm transition-all ${validationErrors[q.id] ? 'ring-2 ring-red-300' : ''}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium leading-relaxed break-keep">
                      <span className="text-blue-600 mr-2">{q.id}.</span>
                      {q.title}
                      {q.required && <span className="text-red-500 ml-1">*</span>}
                    </CardTitle>
                    {q.helpText && (
                      <CardDescription className="whitespace-pre-line">
                        {q.helpText}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <QuestionRenderer
                      question={q}
                      value={responses[q.id]}
                      onChange={(value) => {
                        setResponse(q.id, value);
                        if (validationErrors[q.id]) {
                          setValidationErrors((prev) => {
                            const next = { ...prev };
                            delete next[q.id];
                            return next;
                          });
                        }
                      }}
                    />
                    {validationErrors[q.id] && (
                      <div className="flex items-center gap-2 mt-3 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {validationErrors[q.id]}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pb-8">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={pageIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> 이전
          </Button>

          {isLastPage ? (
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? '제출 중...' : '설문 제출'}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
              다음 <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
