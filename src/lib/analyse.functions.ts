import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Analysis = {
  meaning: string;
  sections: { code: string; explanation: string }[];
  rights: string[];
  is_criminal: boolean;
  bail: { status: string; summary: string; steps: string[] };
  next_steps: string[];
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["meaning", "sections", "rights", "is_criminal", "bail", "next_steps"],
  properties: {
    meaning: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["code", "explanation"],
        properties: { code: { type: "string" }, explanation: { type: "string" } },
      },
    },
    rights: { type: "array", items: { type: "string" } },
    is_criminal: { type: "boolean" },
    bail: {
      type: "object",
      additionalProperties: false,
      required: ["status", "summary", "steps"],
      properties: {
        status: { type: "string", enum: ["bailable", "non-bailable", "mixed", "unclear", "not applicable"] },
        summary: { type: "string" },
        steps: { type: "array", items: { type: "string" } },
      },
    },
    next_steps: { type: "array", items: { type: "string" } },
  },
};

const SYSTEM = `You are TRANA, a legal first-aid guide for people in India. You give plain-language legal INFORMATION, never legal advice.
- Use current Indian law: Bharatiya Nyaya Sanhita (BNS), Bharatiya Nagarik Suraksha Sanhita (BNSS), Bharatiya Sakshya Adhiniyam (BSA). If the user cites an old IPC/CrPC section (e.g. IPC 420), name it and give the BNS/BNSS equivalent (e.g. BNS 318).
- Write simply, for someone frightened and with no legal background. Short sentences.
- "meaning": 2-4 short paragraphs explaining the situation.
- "sections": each law section identified, with a one-line plain explanation. Empty if none.
- "rights": the person's key rights in this situation.
- "is_criminal": true only for criminal matters. If false, set bail.status "not applicable", empty summary and steps.
- "bail": eligibility under BNSS and practical steps.
- "next_steps": concrete actions for the next 24 hours, including speaking to a qualified lawyer.
- Never guarantee outcomes. If information is missing, say what is unclear.`;

type Input = { situation: string; file?: { name: string; type: string; dataUrl: string } | null };

export const analyseSituation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input) => {
    const situation = String(input.situation ?? "").trim().slice(0, 8000);
    const file = input.file ?? null;
    if (!situation && !file) throw new Error("Please describe your situation or upload a document.");
    if (file && file.dataUrl.length > 7_000_000) throw new Error("That file is too large. Please upload a file under 5 MB.");
    return { situation, file };
  })
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("The analyser is not configured yet.");

    const content: Record<string, unknown>[] = [
      { type: "input_text", text: data.situation || "Please explain the attached document." },
    ];
    if (data.file) {
      if (data.file.type.startsWith("image/")) content.push({ type: "input_image", image_url: data.file.dataUrl });
      else content.push({ type: "input_file", filename: data.file.name, file_data: data.file.dataUrl });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM,
        input: [{ role: "user", content }],
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name: "analysis", strict: true, schema } },
      }),
    });

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      console.error("AI gateway error", res.status, body);
      if (res.status === 402) throw new Error("TRANA's AI credits have run out. Please try again later.");
      if (res.status === 429) throw new Error("Too many requests right now. Please wait a minute and try again.");
      throw new Error("The analyser couldn't respond. Please try again shortly.");
    }

    // Consume the SSE stream server-side and collect the final text.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let text = "";
    let refused = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const ev = JSON.parse(payload);
            if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
            if (ev.type === "response.refusal.delta" || ev.type === "response.refusal.done") refused = true;
            if (ev.type === "response.failed" || ev.type === "error") throw new Error("failed");
          } catch (e) {
            if (e instanceof Error && e.message === "failed") throw new Error("The analyser couldn't finish. Please try again.");
          }
        }
      }
    }
    if (refused || !text) throw new Error("TRANA couldn't analyse this. Please speak to a lawyer directly.");

    const result = JSON.parse(text) as Analysis;
    const { data: row, error } = await context.supabase
      .from("analyses")
      .insert({
        user_id: context.userId,
        situation: data.situation || `Uploaded document: ${data.file?.name ?? ""}`,
        result: result as never,
        is_criminal: result.is_criminal,
      })
      .select("id")
      .single();
    if (error) console.error(error);
    return { id: row?.id ?? null, result };
  });
