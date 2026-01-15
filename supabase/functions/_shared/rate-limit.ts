// Rate limiting helper for Edge Functions
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@^2";

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  // Count requests in window
  const { count, error } = await supabase
    .from("api_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", windowStart);

  if (error) {
    console.error("Rate limit check error:", error);
    // Fail open - allow request if we can't check
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW };
  }

  const currentCount = count || 0;
  const allowed = currentCount < MAX_REQUESTS_PER_WINDOW;
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - currentCount);

  // Log request if allowed
  if (allowed) {
    await supabase.from("api_requests").insert({
      user_id: userId,
      endpoint,
    });
  }

  return { allowed, remaining };
}

export function rateLimitResponse(remaining: number): Response {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      errorRu: "Слишком много запросов. Подожди минуту.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": remaining.toString(),
        "Retry-After": "60",
      },
    }
  );
}
