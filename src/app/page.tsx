'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SURVEY_META } from '@/data/kmou-questions';
import { ClipboardList, GraduationCap, Gift, Clock, ChevronRight, Shield, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const content = {
  ko: {
    badge: '2025학년도',
    title: '국립한국해양대학교\n대학원 종합 설문조사',
    description:
      '본 설문은 비교과 프로그램 만족도 및 수요를 파악하고, 대학원 교육 및 연구환경을 평가하기 위해 실시됩니다. 응답 내용은 통계 목적으로만 활용되며, 개인정보는 철저히 보호됩니다.',
    time: `예상 소요시간: ${SURVEY_META.estimatedTime}`,
    partA: { title: '파트 A', desc: '비교과 프로그램 만족도 및 수요조사' },
    partB: { title: '파트 B', desc: '대학원 교육 및 연구환경 만족도 조사' },
    partC: { title: '커피 기프티콘', desc: '설문 참여자 전원에게 커피 기프티콘을 지급합니다' },
    ctaKo: '설문 시작하기',
    ctaEn: 'Start Survey (English)',
    privacy: {
      title: '개인정보 수집·이용 동의',
      items: [
        { label: '수집 항목', value: '소속 학과, 과정, 학기, 연락처(커피 기프티콘 발송용)' },
        { label: '수집 목적', value: '비교과 프로그램 만족도 조사 및 교육환경 개선, 기프티콘 발송' },
        { label: '보유 기간', value: '조사 완료 후 1년 이내 파기' },
      ],
      notice: '※ 동의를 거부할 수 있으며, 거부 시 설문 참여 및 기프티콘 수령이 제한됩니다.',
      agree: '위 개인정보 수집·이용에 동의합니다.',
    },
    footerPrivacy: '응답 내용은 통계 목적으로만 활용되며, 개인정보는 철저히 보호됩니다.',
    footerCopy: '© 2025 국립한국해양대학교 대학원. All rights reserved.',
  },
  en: {
    badge: 'Academic Year 2025',
    title: 'Korea Maritime & Ocean University\nGraduate School Survey',
    description:
      'This survey aims to assess satisfaction with extracurricular programs and evaluate the graduate education and research environment. All responses will be used for statistical purposes only, and your privacy is fully protected.',
    time: `Estimated time: ${SURVEY_META.estimatedTime}`,
    partA: { title: 'Part A', desc: 'Extracurricular Program Satisfaction & Demand' },
    partB: { title: 'Part B', desc: 'Education & Research Environment Satisfaction' },
    partC: { title: 'Coffee Gift Card', desc: 'All participants will receive a coffee gift card' },
    ctaKo: '설문 시작하기 (한국어)',
    ctaEn: 'Start Survey (English)',
    privacy: {
      title: 'Consent to Collection and Use of Personal Information',
      items: [
        { label: 'Data Collected', value: 'Department, program, semester, contact info (for gift card delivery)' },
        { label: 'Purpose', value: 'Extracurricular program satisfaction survey, education improvement, gift card delivery' },
        { label: 'Retention', value: 'Destroyed within 1 year after survey completion' },
      ],
      notice: '※ You may refuse consent. If refused, survey participation and gift card receipt will be restricted.',
      agree: 'I agree to the collection and use of personal information as described above.',
    },
    footerPrivacy: 'All responses are used for statistical purposes only. Your privacy is fully protected.',
    footerCopy: '© 2025 Korea Maritime & Ocean University Graduate School. All rights reserved.',
  },
} as const;

type Lang = 'ko' | 'en';

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('ko');
  const [agreed, setAgreed] = useState(false);
  const t = content[lang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 text-white">
      {/* Language Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center bg-white/10 rounded-full p-1 gap-1 backdrop-blur-sm border border-white/20">
          <button
            onClick={() => setLang('ko')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              lang === 'ko'
                ? 'bg-white text-blue-900 shadow'
                : 'text-white/70 hover:text-white'
            }`}
          >
            한국어
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              lang === 'en'
                ? 'bg-white text-blue-900 shadow'
                : 'text-white/70 hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl px-8 py-4 shadow-lg">
            <Image
              src="/kmou-logo-full.gif"
              alt="국립한국해양대학교 BrainKorea21 로고"
              width={440}
              height={50}
              priority
              unoptimized
              className="h-10 md:h-12 w-auto"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-8 text-sm">
          <GraduationCap className="h-4 w-4" />
          <span>{t.badge}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
          {t.title.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < t.title.split('\n').length - 1 && <br />}
            </span>
          ))}
        </h1>

        <p className="text-blue-200 max-w-2xl mx-auto mb-4 leading-relaxed text-sm md:text-base">
          {t.description}
        </p>

        <div className="inline-flex items-center gap-2 text-blue-300 text-sm mb-10">
          <Clock className="h-4 w-4" />
          <span>{t.time}</span>
        </div>
      </div>

      {/* Part Cards */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center mb-2">
                <ClipboardList className="h-5 w-5 text-blue-200" />
              </div>
              <CardTitle className="text-base text-white">{t.partA.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-200 text-sm">{t.partA.desc}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 bg-indigo-500/30 rounded-lg flex items-center justify-center mb-2">
                <GraduationCap className="h-5 w-5 text-indigo-200" />
              </div>
              <CardTitle className="text-base text-white">{t.partB.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-200 text-sm">{t.partB.desc}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 bg-emerald-500/30 rounded-lg flex items-center justify-center mb-2">
                <Gift className="h-5 w-5 text-emerald-200" />
              </div>
              <CardTitle className="text-base text-white">{t.partC.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-200 text-sm">{t.partC.desc}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Privacy Consent */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-300" />
            {t.privacy.title}
          </h3>

          <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-2">
            {t.privacy.items.map((item, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="text-blue-300 font-medium whitespace-nowrap">{item.label}:</span>
                <span className="text-blue-100">{item.value}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-blue-300 mb-4">{t.privacy.notice}</p>

          <button
            onClick={() => setAgreed(!agreed)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
              agreed
                ? 'border-emerald-400 bg-emerald-500/20'
                : 'border-white/30 hover:border-white/50'
            }`}
          >
            <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
              agreed
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-white/40'
            }`}>
              {agreed && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className={`text-sm font-medium ${agreed ? 'text-emerald-200' : 'text-blue-100'}`}>
              {t.privacy.agree}
            </span>
          </button>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 pb-16 text-center">
        <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
          {agreed ? (
            <>
              <Link href="/survey">
                <Button
                  size="lg"
                  className="bg-white text-blue-900 hover:bg-blue-50 text-base px-8 py-6 rounded-xl font-semibold shadow-lg"
                >
                  {t.ctaKo}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/en/survey">
                <Button
                  size="lg"
                  className="bg-white/10 text-white border border-white hover:bg-white/20 text-base px-8 py-6 rounded-xl font-semibold"
                >
                  {t.ctaEn}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </>
          ) : (
            <Button
              size="lg"
              disabled
              className="bg-white/20 text-white/50 text-base px-8 py-6 rounded-xl font-semibold cursor-not-allowed"
            >
              {lang === 'ko' ? '개인정보 수집·이용에 동의해 주세요' : 'Please agree to the privacy terms above'}
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-300 text-xs mb-2">
            <Shield className="h-3 w-3" />
            <span>{t.footerPrivacy}</span>
          </div>
          <p className="text-blue-400 text-xs">{t.footerCopy}</p>
        </div>
      </footer>
    </div>
  );
}
