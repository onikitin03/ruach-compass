// Edge Function: Generate Reset Protocol
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@^2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { generateContent, extractJSON, safeParseJSON } from "../_shared/gemini.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import {
  RESET_PROTOCOL_SYSTEM_PROMPT,
  buildResetProtocolUserPrompt,
  FALLBACK_RESET_PROTOCOLS,
} from "../_shared/prompts.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", errorRu: "Необходима авторизация" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { trigger, contextSummary, useFallback } = body;

    if (!trigger) {
      return new Response(
        JSON.stringify({ error: "Invalid request", errorRu: "Укажите триггер" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use fallback if requested (offline mode)
    if (useFallback) {
      const fallbackProtocol = FALLBACK_RESET_PROTOCOLS[trigger] || FALLBACK_RESET_PROTOCOLS.overwhelm;
      return new Response(
        JSON.stringify({
          trigger,
          steps: fallbackProtocol,
          trustAnchorRu: "ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.",
          source: "fallback",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const { allowed, remaining } = await checkRateLimit(supabase, user.id, "generate-reset");
    if (!allowed) {
      return rateLimitResponse(remaining);
    }

    // Build prompt and generate
    const userPrompt = buildResetProtocolUserPrompt({
      trigger,
      currentContext: contextSummary,
    });

    try {
      const responseText = await generateContent(
        RESET_PROTOCOL_SYSTEM_PROMPT,
        userPrompt
      );

      // Parse response
      const jsonString = extractJSON(responseText);
      const parsed = safeParseJSON(jsonString, null);

      if (!parsed || !parsed.steps) {
        throw new Error("Invalid response format");
      }

      return new Response(
        JSON.stringify({
          ...parsed,
          source: "ai",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": remaining.toString(),
          },
        }
      );
    } catch (aiError) {
      // Fallback to pre-built protocol on AI error
      console.error("AI generation failed, using fallback:", aiError);
      const fallbackProtocol = FALLBACK_RESET_PROTOCOLS[trigger] || FALLBACK_RESET_PROTOCOLS.overwhelm;

      return new Response(
        JSON.stringify({
          trigger,
          steps: fallbackProtocol,
          trustAnchorRu: "ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.",
          source: "fallback",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Generate reset error:", error);

    // Always return a fallback on error for reset (critical feature)
    const trigger = "overwhelm";
    const fallbackProtocol = FALLBACK_RESET_PROTOCOLS[trigger];

    return new Response(
      JSON.stringify({
        trigger,
        steps: fallbackProtocol,
        trustAnchorRu: "ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.",
        source: "fallback",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
