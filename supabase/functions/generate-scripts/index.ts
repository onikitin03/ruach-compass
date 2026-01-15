// Edge Function: Generate Scripts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@^2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { generateContent, extractJSON, safeParseJSON } from "../_shared/gemini.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import {
  SCRIPT_GENERATION_SYSTEM_PROMPT,
  buildScriptGenerationUserPrompt,
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

    // Check rate limit
    const { allowed, remaining } = await checkRateLimit(supabase, user.id, "generate-scripts");
    if (!allowed) {
      return rateLimitResponse(remaining);
    }

    // Parse request body
    const body = await req.json();
    const { scenarioType, contextSummary, userProfile } = body;

    if (!scenarioType) {
      return new Response(
        JSON.stringify({ error: "Invalid request", errorRu: "Укажите тип сценария" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt and generate
    const userPrompt = buildScriptGenerationUserPrompt({
      scenarioType,
      contextSummary,
      boundariesStyle: userProfile?.boundariesStyle,
    });

    const responseText = await generateContent(
      SCRIPT_GENERATION_SYSTEM_PROMPT,
      userPrompt
    );

    // Parse response
    const jsonString = extractJSON(responseText);
    const parsed = safeParseJSON(jsonString, null);

    if (!parsed || !parsed.variants) {
      return new Response(
        JSON.stringify({
          error: "Failed to generate scripts",
          errorRu: "Не удалось сгенерировать скрипты",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cache scripts in DB (upsert by user + scenario)
    await supabase
      .from("scripts_cache")
      .upsert({
        user_id: user.id,
        scenario_type: scenarioType,
        short_ru: parsed.variants.shortRu,
        neutral_ru: parsed.variants.neutralRu,
        boundary_ru: parsed.variants.boundaryRu,
        exit_ru: parsed.variants.exitRu,
        tone_notes_ru: parsed.toneNotesRu,
        safety_flags: parsed.safetyFlags || [],
      }, { onConflict: "user_id,scenario_type" });

    return new Response(JSON.stringify(parsed), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": remaining.toString(),
      },
    });
  } catch (error) {
    console.error("Generate scripts error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        errorRu: "Внутренняя ошибка сервера",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
