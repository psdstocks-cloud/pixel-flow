import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  if (token && type === 'signup') {
    const supabase = await createClient(); // ✅ ADD await here
    const { error } = await supabase.auth.verifyOtp({ 
      token_hash: token, 
      type: 'email' 
    });
    
    if (!error) {
      return NextResponse.redirect(new URL('/dashboard/stock/order-v2', request.url));
    }
  }

  return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
}
