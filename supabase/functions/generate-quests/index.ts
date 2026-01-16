// Edge Function: Generate Quests
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@^2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { generateContent, extractJSON, safeParseJSON } from "../_shared/gemini.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import {
  QUEST_GENERATION_SYSTEM_PROMPT,
  buildQuestGenerationUserPrompt,
} from "../_shared/prompts.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Check Authorization header exists
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header", errorRu: "Необходима авторизация" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with Auth header (official docs pattern)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user (uses header from client config)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", errorRu: "Необходима авторизация", details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const { allowed, remaining } = await checkRateLimit(supabase, user.id, "generate-quests");
    if (!allowed) {
      return rateLimitResponse(remaining);
    }

    // Parse request body
    const body = await req.json();
    const { dailyState, userProfile } = body;

    if (!dailyState?.energy || !dailyState?.stress || !dailyState?.focus) {
      return new Response(
        JSON.stringify({ error: "Invalid request", errorRu: "Неверный запрос" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt and generate
    const userPrompt = buildQuestGenerationUserPrompt({
      energy: dailyState.energy,
      stress: dailyState.stress,
      sleepHours: dailyState.sleepHours || 7,
      focus: dailyState.focus,
      relationshipIntensity: dailyState.relationshipIntensity,
      workIntensity: dailyState.workIntensity,
      notes: dailyState.notes,
    });

    const responseText = await generateContent(
      QUEST_GENERATION_SYSTEM_PROMPT,
      userPrompt
    );

    // Parse response
    const jsonString = extractJSON(responseText);
    const parsed = safeParseJSON(jsonString, null);

    if (!parsed || !parsed.quests) {
      return new Response(
        JSON.stringify({
          error: "Failed to generate quests",
          errorRu: "Не удалось сгенерировать квесты",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save daily state to DB
    const today = new Date().toISOString().split("T")[0];
    const { data: savedState } = await supabase
      .from("daily_states")
      .upsert({
        user_id: user.id,
        date: today,
        energy: dailyState.energy,
        stress: dailyState.stress,
        sleep_hours: dailyState.sleepHours,
        focus: dailyState.focus,
        relationship_intensity: dailyState.relationshipIntensity,
        work_intensity: dailyState.workIntensity,
        notes: dailyState.notes,
        ruach_state: parsed.stateAssessment?.ruachState,
      }, { onConflict: "user_id,date" })
      .select()
      .single();

    // Save quests to DB
    if (savedState) {
      const questsToInsert = parsed.quests.map((q: any) => ({
        user_id: user.id,
        daily_state_id: savedState.id,
        date: today,
        type: q.type,
        category: q.category,
        title_ru: q.titleRu,
        why_ru: q.whyRu,
        steps_ru: q.stepsRu,
        fail_safe_ru: q.failSafeRu,
      }));

      await supabase.from("quests").insert(questsToInsert);
    }

    return new Response(JSON.stringify(parsed), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": remaining.toString(),
      },
    });
  } catch (error) {
    console.error("Generate quests error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        errorRu: "Внутренняя ошибка сервера",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
