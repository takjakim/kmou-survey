'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { KMOU_SURVEY_QUESTIONS_EN, SURVEY_SECTIONS_EN, type SurveyQuestion } from '@/data/kmou-questions-en';
import { useSurveyStore } from '@/store/surveyStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QuestionRendererEN } from '@/components/survey/QuestionRendererEN';
import { ChevronLeft, ChevronRight, Send, AlertCircle } from 'lucide-react';

const PAGE_SIZE = 5;

interface SurveyPage {
  questions: SurveyQuestion[];
  section: string;
  sectionTitle: string;
  part: 'A' | 'B' | 'C';
}

/**
 * Group questions into pages of ~PAGE_SIZE, splitting by:
 * 1. Part boundary (always new page)
 * 2. Section boundary (always new page)
 * 3. Within a section, chunk by PAGE_SIZE
 * 4. "Big" questions (ranking, paragraph, checkbox with many options) get their own page or smaller groups
 */
function buildPages(questions: SurveyQuestion[]): SurveyPage[] {
  const pages: SurveyPage[] = [];
  let currentBatch: SurveyQuestion[] = [];
  let currentSection = '';
  let currentPart = '';

  const flush = () => {
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

  for (const q of questions) {
    // Part or section change -> flush
    if (q.part !== currentPart || q.section !== currentSection) {
      flush();
      currentPart = q.part;
      currentSection = q.section;
    }

    // "Big" question types get their own page or small group
    const isBig = q.type === 'ranking' || q.type === 'paragraph' ||
      (q.type === 'checkbox' && (q.options?.length || 0) > 6);

    if (isBig) {
      flush();
      currentBatch.push(q);
      flush();
      continue;
    }

    currentBatch.push(q);

    // Chunk by PAGE_SIZE
    if (currentBatch.length >= PAGE_SIZE) {
      flush();
    }
  }

  flush();
  return pages;
}

export default function SurveyPageEN() {
  const router = useRouter();
  const { responses, setResponse } = useSurveyStore();
  const [pageIndex, setPageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPartTransition, setShowPartTransition] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const submissionIdRef = useRef<string | null>(null);

  // Build pages from ALL questions (including conditional ones)
  const allPages = useMemo(() => buildPages(KMOU_SURVEY_QUESTIONS_EN), []);

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
    return KMOU_SURVEY_QUESTIONS_EN.filter(isQuestionVisible);
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
    ? SURVEY_SECTIONS_EN.find((s) => s.id === currentPage.section)
    : null;

  const validatePage = useCallback((): boolean => {
    if (!currentPage) return true;
    const errors: Record<string, string> = {};

    for (const q of currentPage.questions) {
      if (!q.required) continue;
      const response = responses[q.id];

      if (response === undefined || response === null || response === '') {
        errors[q.id] = 'This is a required question.';
        continue;
      }
      if (Array.isArray(response) && response.length === 0) {
        errors[q.id] = 'This is a required question.';
        continue;
      }
      if (q.type === 'ranking' && q.rankingCount) {
        if (!Array.isArray(response) || response.length < q.rankingCount) {
          errors[q.id] = `Please select all ${q.rankingCount} items.`;
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
          language: 'en',
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
          language: 'en',
          id: submissionIdRef.current || undefined,
          status: 'complete',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/en/complete?id=${data.id}`);
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
        <p>Loading survey...</p>
      </div>
    );
  }

  // Part transition screen
  if (showPartTransition) {
    const nextPage = pages[pageIndex + 1];
    const nextPart = nextPage?.part;
    const nextPartLabel = nextPart === 'B'
      ? 'Part B: Graduate Education & Research Environment Satisfaction Survey'
      : 'Prize Draw Entry';
    const nextPartDesc = nextPart === 'B'
      ? 'Please evaluate the educational services, curriculum, and research environment of the graduate school.'
      : 'Thank you for participating in the survey. Please enter the following information to receive a coffee gift card.';

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
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const partLabel = currentPage.part === 'A'
    ? 'Part A: Extracurricular Programs'
    : currentPage.part === 'B'
      ? 'Part B: Education & Research Environment'
      : 'Prize Draw Entry';

  const isLastPage = pageIndex === totalPages - 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">{partLabel}</span>
            <span className="text-sm text-muted-foreground">
              Page {pageIndex + 1} / {totalPages}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

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
          {currentPage.questions.map((q, idx) => (
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
                  <QuestionRendererEN
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
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pb-8">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={pageIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          {isLastPage ? (
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Survey'}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
