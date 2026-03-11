#!/usr/bin/env node
/**
 * Part A 설문 분석 스크립트
 * 사용법: node scripts/analyze-partA.js
 * .env.local에서 SUPABASE_SERVICE_ROLE_KEY를 자동으로 읽습니다.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// .env.local에서 키 읽기
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

if (!urlMatch || !keyMatch) {
  console.error('.env.local에서 Supabase 키를 찾을 수 없습니다.');
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const key = keyMatch[1].trim();
const apiUrl = `${supabaseUrl}/rest/v1/kmou_survey_submissions?select=responses,status,language,submitted_at&order=submitted_at.desc`;

https.get(apiUrl, { headers: { apikey: key, Authorization: `Bearer ${key}` } }, (res) => {
  let buf = '';
  res.on('data', c => buf += c);
  res.on('end', () => {
    const data = JSON.parse(buf);
    if (data.message) { console.log('Error:', data.message); return; }

    const all = data.filter(r => r.responses);
    const completeOnly = data.filter(r => r.status === 'complete');
    const N = all.length;

    // 응답 기간
    const dates = all.map(r => r.submitted_at.substring(0, 10)).sort();
    const dateCount = {};
    dates.forEach(d => { dateCount[d] = (dateCount[d] || 0) + 1; });
    const sortedDates = Object.entries(dateCount).sort((a, b) => b[1] - a[1]);
    const top2 = sortedDates.slice(0, 2).sort((a, b) => a[0].localeCompare(b[0]));
    const top2Count = top2.reduce((s, d) => s + d[1], 0);

    const pct = (n, t) => ((n / t) * 100).toFixed(1);

    function countCheckbox(qId) {
      const counts = {};
      let total = 0;
      all.forEach(r => {
        const v = r.responses[qId];
        if (Array.isArray(v) && v.length > 0) { total++; v.forEach(opt => { counts[opt] = (counts[opt] || 0) + 1; }); }
      });
      return { counts, total };
    }

    function countRadio(qId) {
      const counts = {};
      let total = 0;
      all.forEach(r => {
        const v = r.responses[qId];
        if (v && typeof v === 'string') { total++; counts[v] = (counts[v] || 0) + 1; }
      });
      return { counts, total };
    }

    function scaleStats(qId) {
      const vals = [];
      let naCount = 0;
      all.forEach(r => {
        const v = r.responses[qId];
        if (typeof v === 'number') { if (v === 6) naCount++; else vals.push(v); }
      });
      const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      return { avg, count: vals.length, naCount };
    }

    function mergeByKeyword(counts, mapping) {
      const merged = {};
      Object.entries(counts).forEach(([k, v]) => {
        let found = false;
        for (const [label, keywords] of Object.entries(mapping)) {
          if (keywords.some(kw => k.includes(kw))) { merged[label] = (merged[label] || 0) + v; found = true; break; }
        }
        if (!found) merged[k] = (merged[k] || 0) + v;
      });
      return merged;
    }

    // =====================================================================
    console.log(`\nPart A: 비교과 프로그램 설문 분석 결과 (총 ${N}명, 완료 ${completeOnly.length}명 + 부분응답 ${N - completeOnly.length}명)\n`);
    console.log(`  - 총 응답자: ${N}명`);
    console.log(`  - 응답 기간: ${dates[0]} ~ ${dates[dates.length-1]} (${top2[0][0].substring(5)}~${top2[1][0].substring(5)}에 ${top2Count}명 집중)\n`);

    // 1. 인지 vs 참여 격차
    console.log('\n1. 인지 vs 실제 참여 격차\n');
    const aware = countCheckbox('A-1-1');
    const part = countCheckbox('A-1-2');

    const awareMap = {
      '장학금/연구비 지원': ['장학금', 'Scholarship'],
      '연구역량강화': ['연구역량', 'Research Capacity'],
      '멘토링/학술교류': ['멘토링', 'Mentoring'],
      '취업/창업/현장학습': ['취업/창업', 'Employment'],
      '연구환경 지원': ['연구환경', 'Research Environment'],
      '신입생 교육': ['신입생', 'New Student'],
    };
    const partMap = {
      '장학금/연구비': ['Fellowship', '학술발표대회 참가비', 'Academic Conference Participation'],
      '연구역량강화': ['논문작성', 'KMOU 대학원 학술발표', 'Thesis Writing', 'KMOU Graduate'],
      '멘토링/학술교류': ['멘토', 'Mentor'],
      '취업/창업/현장학습': ['기업체', 'JOB-TALKING', 'Company Field'],
      '연구환경 지원': ['Open-Lab', 'TA/RA', 'Research Lab'],
      '신입생 교육': ['신입생', 'New Student', 'Welcome'],
      '프로그램 없음': ['없음', 'not participated'],
    };

    const awareM = mergeByKeyword(aware.counts, awareMap);
    const partM = mergeByKeyword(part.counts, partMap);
    const cats = ['장학금/연구비 지원', '연구역량강화', '멘토링/학술교류', '취업/창업/현장학습', '연구환경 지원', '신입생 교육'];
    const partCats = ['장학금/연구비', '연구역량강화', '멘토링/학술교류', '취업/창업/현장학습', '연구환경 지원', '신입생 교육'];

    cats.forEach((cat, i) => {
      const aw = awareM[cat] || 0;
      const pa = partM[partCats[i]] || 0;
      const awPct = parseFloat(pct(aw, aware.total));
      const paPct = parseFloat(pct(pa, part.total));
      const gap = (paPct - awPct).toFixed(1);
      console.log(`    - ${cat}: 인지 ${awPct}% → 참여 ${paPct}% (격차 ${gap}%p)`);
    });
    const noPart = partM['프로그램 없음'] || 0;
    console.log(`\n    - ${pct(noPart, part.total)}%는 어떤 프로그램에도 참여하지 않음`);

    // 2. 미참여 원인
    console.log('\n\n2. 미참여 1위 원인\n');
    const reasons = countCheckbox('A-5-1');
    const reasonM = mergeByKeyword(reasons.counts, {
      '프로그램을 몰랐음': ['몰랐', 'not aware'],
      '시간이 맞지 않음': ['시간', 'schedule'],
      '참여 여유 없음': ['여유', 'time to participate'],
      '관심 프로그램 없음': ['관심', 'interest'],
      '해당 없음': ['해당', 'Not applicable'],
      '선발 안됨': ['선발', 'selected'],
    });
    const sortedR = Object.entries(reasonM).sort((a, b) => b[1] - a[1]);
    console.log(`    "${sortedR[0][0]}" (${pct(sortedR[0][1], reasons.total)}%)`);
    console.log('    → 홍보 강화만으로 참여율 개선 가능');

    // 3. 만족도
    console.log('\n\n3. 비교과 프로그램 만족도 (참여자 대상, 5점 척도)\n');
    const sqs = [
      { id: 'A-2-1', label: '연구역량강화 프로그램' },
      { id: 'A-2-2', label: '장학금/연구비 지원' },
      { id: 'A-2-3', label: '취업/창업/현장학습' },
      { id: 'A-2-4', label: '홍보/안내 및 신청 절차' },
      { id: 'A-2-5', label: '전반적 만족도' },
    ];
    let minAvg = 99, minLabel = '';
    sqs.forEach(q => {
      const s = scaleStats(q.id);
      const info = s.naCount > 0 ? `(참여자 ${s.count}명)` : '';
      console.log(`    - ${q.label}: ${s.avg.toFixed(2)}/5 ${info}`);
      if (s.avg < minAvg && s.count > 50) { minAvg = s.avg; minLabel = q.label; }
    });
    console.log(`\n    → ${minLabel} (${minAvg.toFixed(2)}/5) 가장 낮음 → 개선 필요`);

    // 4. 효과성
    console.log('\n\n4. 효과성 평가\n');
    const e1 = scaleStats('A-3-1');
    const e2 = scaleStats('A-3-2');
    console.log(`    - 전문성 향상 기여도: ${e1.avg.toFixed(2)}/5`);
    console.log(`    - 연구 역량 도움 정도: ${e2.avg.toFixed(2)}/5`);

    // 5. 수요
    console.log('\n\n5. 대학원생 수요 TOP 3\n');
    const needsRaw = countCheckbox('A-4-2');
    const needsM = mergeByKeyword(needsRaw.counts, {
      '장학금/연구비 확대': ['장학금', 'Expanded scholarships'],
      '논문작성 지원': ['논문작성', 'Thesis/paper'],
      '연구방법론/통계 교육': ['연구방법론', 'Research methodology'],
      'AI/데이터 분석 교육': ['AI', 'data analysis'],
      '연구환경 개선': ['연구환경', 'Research environment'],
      '취업/진로 상담': ['취업', 'Career'],
      '학술대회 지원': ['학술대회', 'Academic conference'],
      '국제교류/해외연수': ['국제교류', 'International'],
      '멘토링/상담': ['멘토링', 'Mentoring'],
      '기타': ['기타', 'Other'],
    });
    const sortedNeeds = Object.entries(needsM).filter(([k]) => k !== '기타').sort((a, b) => b[1] - a[1]).slice(0, 3);
    console.log('  [필요 프로그램]');
    sortedNeeds.forEach(([opt, cnt], i) => { console.log(`    ${i + 1}. ${opt} (${pct(cnt, needsRaw.total)}%)`); });

    const newRaw = countCheckbox('A-4-3');
    const newM = mergeByKeyword(newRaw.counts, {
      'AI/머신러닝 교육': ['AI', 'machine learning'],
      '학술발표 스킬': ['학술발표', 'Academic presentation'],
      '영문논문 작성': ['영문논문', 'English academic'],
      '통계분석 실습 (R, Python)': ['통계분석', 'Statistical analysis'],
      '기업 멘토링/인턴십': ['기업 멘토링', 'Corporate mentoring'],
      '심리상담/스트레스 관리': ['심리상담', 'counseling'],
      '기타': ['기타', 'Other'],
    });
    const sortedNew = Object.entries(newM).filter(([k]) => k !== '기타').sort((a, b) => b[1] - a[1]).slice(0, 3);
    console.log('\n  [신규 희망 교육]');
    sortedNew.forEach(([opt, cnt], i) => { console.log(`    ${i + 1}. ${opt} (${pct(cnt, newRaw.total)}%)`); });

    const timeRaw = countCheckbox('A-4-5');
    const timeM = mergeByKeyword(timeRaw.counts, {
      '온라인 상시': ['온라인', 'Online'],
      '평일 오후': ['평일 오후', 'Weekday afternoon'],
      '평일 저녁': ['평일 저녁', 'Weekday evening'],
      '주말': ['주말', 'Weekend'],
      '평일 오전': ['평일 오전', 'Weekday morning'],
    });
    const topTime = Object.entries(timeM).sort((a, b) => b[1] - a[1])[0];
    console.log(`\n  [선호 시간] ${topTime[0]} (${pct(topTime[1], timeRaw.total)}%)`);

    const modeRaw = countRadio('A-4-4');
    const modeM = mergeByKeyword(modeRaw.counts, {
      '하이브리드': ['하이브리드', 'Hybrid'],
      '비대면 위주': ['비대면', 'online'],
      '프로그램에 따라 다름': ['프로그램에 따라', 'Depends'],
      '대면 위주': ['대면 위주', 'in-person'],
    });
    const topMode = Object.entries(modeM).sort((a, b) => b[1] - a[1])[0];
    console.log(`  [선호 운영 방식] ${topMode[0]} (${pct(topMode[1], modeRaw.total)}%)`);

    // 6. 어려움
    console.log('\n\n6. 대학원 생활 어려움 TOP 3\n');
    const diffRaw = countCheckbox('A-4-1');
    const diffM = mergeByKeyword(diffRaw.counts, {
      '연구 주제 설정/방향': ['연구 주제', 'Setting research'],
      '논문 작성': ['논문 작성', 'Writing thesis'],
      '연구비/생활비 부족': ['연구비', 'Insufficient'],
      '학업-생활 균형': ['학업-생활', 'Work-life'],
      '진로/취업 준비': ['진로', 'Career'],
      '연구방법론/통계': ['연구방법론', 'Research methodology'],
      '기타': ['기타', 'Other'],
    });
    const sortedDiff = Object.entries(diffM).filter(([k]) => k !== '기타').sort((a, b) => b[1] - a[1]).slice(0, 3);
    sortedDiff.forEach(([opt, cnt], i) => { console.log(`    ${i + 1}. ${opt} (${pct(cnt, diffRaw.total)}%)`); });

    // 7. 일별 분포
    console.log('\n\n7. 일별 응답 분포\n');
    Object.entries(dateCount).sort().forEach(([d, c]) => {
      const bar = '█'.repeat(Math.round(c / 3));
      console.log(`    ${d}: ${String(c).padStart(3)}명 ${bar}`);
    });
    console.log('');
  });
});
