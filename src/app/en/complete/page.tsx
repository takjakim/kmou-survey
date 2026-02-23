'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Home } from 'lucide-react';
import Link from 'next/link';

function CompleteContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center shadow-lg">
        <CardHeader className="pb-4">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Survey Completed!</CardTitle>
          <CardDescription className="mt-2 text-base">
            Thank you for taking the time to complete this survey.
            <br />
            Your feedback will help us improve our graduate programs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {id && (
            <p className="text-xs text-muted-foreground">
              Response ID: {id.slice(0, 8)}...
            </p>
          )}
          <Link href="/">
            <Button variant="outline" className="w-full mt-4">
              <Home className="mr-2 h-4 w-4" /> Return to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompletePageEN() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CompleteContent />
    </Suspense>
  );
}
