// apps/web/app/auth/confirm/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  if (token && type === 'signup') {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ token, type: 'signup' });
    
    if (!error) {
      return NextResponse.redirect('/dashboard/stock/order-v2');
    }
  }

  return NextResponse.redirect('/login?error=verification_failed');
}