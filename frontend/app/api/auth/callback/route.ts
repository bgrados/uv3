import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // After successful OAuth, Supabase redirects back to this route.
  // We'll just redirect to the home page.
  return NextResponse.redirect(new URL('/', req.url));
}
