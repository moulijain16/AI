import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

type Submission = {
  learnerId?: string;
  sessionId?: string;
  assessmentId?: string;
  assignmentId?: string;
  answer?: string | null;
  uploadedImage?: string | null;
  score?: number;
  feedback?: string;
  strengths?: string[] | string;
  improvements?: string[] | string;
  finalSubmit?: boolean;
};

type Evaluation = {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  missingTerms?: string[];
  missingElements?: string[];
};

const promptScenario = "A sustainable Indian skincare brand is launching a monsoon campaign for young professionals. The image should feel premium, contemporary, natural, and suitable for a social media hero image.";
const promptTerms = ["sustainable", "Indian", "skincare", "monsoon", "campaign", "young professionals", "premium", "contemporary", "natural", "social media", "hero image"];
const imageElements = [
  "magical library inside giant glowing oak tree",
  "orange fox",
  "tiny round spectacles",
  "fox reading a book",
  "plush velvet armchair",
  "glowing spell books",
  "blue and gold magical dust",
  "night/cozy cinematic atmosphere",
];
const exactImagePrompt = "A magical library inside a giant glowing oak tree with an orange fox wearing tiny round spectacles, reading a book while seated in a plush velvet armchair, surrounded by glowing spell books and blue and gold magical dust, with a night-time cozy cinematic atmosphere.";

async function evaluateWithGemini(assessmentId: string, answer: string | null, uploadedImage: string | null): Promise<Evaluation> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");
  const parts: Array<Record<string, unknown>> = [];
  if (assessmentId === "prompt-image-generation") {
    parts.push({ text: `Q1 PROMPT ENGINEERING EVALUATION. Evaluate ONLY the student's written prompt below. Do not evaluate an image and do not infer visual quality. Compare the text only against this scenario: ${promptScenario}. Check only whether these important terms or equivalent concepts are present: ${promptTerms.join(", ")}. Score as the percentage of required terms covered. Return JSON ONLY in this exact shape: {"score": number, "missingTerms": string[]}. missingTerms must contain at most 5 items and must contain only terms absent from the student's written prompt. Student prompt: ${answer ?? ""}` });
  } else if (assessmentId === "magical-library-fox") {
    if (!uploadedImage) throw new Error("An uploaded image is required for image evaluation.");
    const match = uploadedImage.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
    if (!match) throw new Error("Uploaded image must be a base64 data URL.");
    parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
    parts.push({ text: `Q2 IMAGE GENERATION EVALUATION. Evaluate ONLY the uploaded image. Do not evaluate, infer, or score any student's written prompt. Compare the actual visible image against this exact required image prompt: ${exactImagePrompt} Check each visual element separately: ${imageElements.map((element, index) => `${index + 1}. ${element}`).join(" ")}. Return JSON ONLY in this exact shape: {"score": number, "missingElements": string[], "feedback": string}. Score only visible visual matches across the eight elements. missingElements must contain at most 5 elements. feedback must be no more than 2 short sentences.` });
  } else {
    throw new Error(`Unsupported assessment: ${assessmentId}`);
  }
  const retryDelays = [2000, 4000, 8000];
  let raw = "";
  let responseStatus = 0;

  for (let attempt = 0; attempt < 4; attempt++) {
  let response: any;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        },
      );
    } catch (error) {
      logger.error({ error, attempt: attempt + 1 }, "Gemini request failed before receiving a response");
      throw new Error("Gemini evaluation could not be reached. Please try again.");
    }

    responseStatus = response.status;
    raw = await response.text();
    let responseMessage = raw.trim();
    try {
      const parsed = JSON.parse(raw) as { error?: { message?: string } };
      responseMessage = parsed.error?.message ?? responseMessage;
    } catch {
      // Keep the raw response text for non-JSON Gemini errors.
    }
    responseMessage = responseMessage.slice(0, 500) || "No response message.";
    logger.warn({ status: response.status, attempt: attempt + 1, message: responseMessage }, "Gemini HTTP response");

    if (response.ok) break;
    const retryable = response.status === 429 || response.status === 500 || response.status === 503 || response.status === 504;
    if (!retryable) throw new Error(`Gemini evaluation failed (${response.status}): ${responseMessage}`);
    if (attempt === 3) {
      throw new Error(`Gemini evaluation failed after 4 attempts (HTTP ${response.status}): ${responseMessage}`);
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
  }

  if (responseStatus < 200 || responseStatus >= 300) {
    throw new Error(`Gemini evaluation failed (${responseStatus}).`);
  }
  let outer: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  try { outer = JSON.parse(raw); } catch { throw new Error("Gemini returned invalid JSON."); }
  const generated = outer.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!generated) throw new Error("Gemini returned an empty evaluation.");
  let evaluation: Partial<Evaluation> & { missingTerms?: unknown; missingElements?: unknown };
  try { evaluation = JSON.parse(generated); } catch { throw new Error("Gemini returned an invalid evaluation format."); }
  if (typeof evaluation.score !== "number") throw new Error("Gemini returned an incomplete evaluation score.");
  if (assessmentId === "prompt-image-generation") {
    if (!Array.isArray(evaluation.missingTerms)) throw new Error("Gemini returned an incomplete Q1 evaluation.");
    const missingTerms = evaluation.missingTerms.map(String).slice(0, 5);
    return {
      score: Math.max(0, Math.min(100, Math.round(evaluation.score))),
      feedback: `Missing important terms: ${missingTerms.length ? missingTerms.join(", ") : "none"}`,
      strengths: [],
      improvements: [],
      missingTerms,
    };
  }
  if (!Array.isArray(evaluation.missingElements) || typeof evaluation.feedback !== "string") throw new Error("Gemini returned an incomplete Q2 evaluation.");
  const feedback = evaluation.feedback.trim().split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  const missingElements = evaluation.missingElements.map(String).slice(0, 5);
  return {
    score: Math.max(0, Math.min(100, Math.round(evaluation.score))),
    feedback,
    strengths: [],
    improvements: [],
    missingElements,
  };
}

const router: IRouter = Router();

router.post("/assessment-submissions", async (req, res) => {
  const body = req.body as Submission;
  const learnerId = req.header("X-User-Id") || body.learnerId;
  const assessmentId = body.assessmentId ?? body.assignmentId;

  const hasExplicitEvaluation = typeof body.score === "number" && typeof body.feedback === "string";
  const isAttemptedResponse = (assessmentId === "prompt-image-generation" && typeof body.answer === "string") || (assessmentId === "magical-library-fox" && typeof body.uploadedImage === "string") || (!body.answer && !body.uploadedImage && body.finalSubmit === true);

  if (!learnerId || !body.sessionId || !assessmentId || !isAttemptedResponse) {
    res.status(400).json({ success: false, error: "A signed-in user, session, assessment, and answer are required." });
    return;
  }

  try {
    let score = body.score;
    let feedback = body.feedback;
    let strengths = body.strengths ?? [];
    let improvements = body.improvements ?? [];

    if (!hasExplicitEvaluation) {
      const evaluation = await evaluateWithGemini(assessmentId, body.answer ?? null, body.uploadedImage ?? null);
      score = evaluation.score;
      feedback = evaluation.feedback;
      strengths = evaluation.strengths;
      improvements = evaluation.improvements;
    }

    if (typeof score !== "number" || typeof feedback !== "string") {
      throw new Error("Assessment submission is missing a score or feedback payload.");
    }

    await db.execute(sql`insert into assessment_submissions (learner_id, session_id, assessment_id, answer, uploaded_image, score, feedback, strengths, improvements) values (${learnerId}, ${body.sessionId}, ${assessmentId}, ${body.answer ?? null}, ${body.uploadedImage ?? null}, ${score}, ${feedback}, ${JSON.stringify(Array.isArray(strengths) ? strengths : [String(strengths)])}, ${JSON.stringify(Array.isArray(improvements) ? improvements : [String(improvements)])})`);
    res.status(201).json({
      success: true,
      score,
      feedback,
      ...(Array.isArray(strengths) && strengths.length ? { strengths } : {}),
      ...(Array.isArray(improvements) && improvements.length ? { improvements } : {}),
    });
  } catch (error) {
    req.log.error({ error }, "Failed to save assessment submission");
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to evaluate and save assessment submission" });
  }
});

export default router;
