import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { responses, language = 'ko', id: existingId, status = 'complete' } = body;

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json(
        { error: '유효하지 않은 응답 데이터입니다.' },
        { status: 400 }
      );
    }

    const id = existingId || crypto.randomUUID();

    if (existingId) {
      // Update existing submission (partial save)
      const { error } = await supabaseAdmin
        .from('kmou_survey_submissions')
        .update({
          responses,
          status,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', existingId);

      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json(
          { error: '응답 저장 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
    } else {
      // Insert new submission
      const { error } = await supabaseAdmin
        .from('kmou_survey_submissions')
        .insert({
          id,
          responses,
          language,
          status,
          submitted_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json(
          { error: '응답 저장 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ id, success: true });
  } catch (error) {
    console.error('Response save error:', error);
    return NextResponse.json(
      { error: '응답 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
