import { UserIdentity, DailyLog, FeedbackData } from "../types";
import { noahCoreEngine } from "../noah-core/engine";

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  try {
    const res = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Audio, mimeType })
    });
    if (!res.ok) throw new Error("Server error on transcribe");
    const json = await res.json();
    return json.text || "";
  } catch (error) {
    console.error("Transcription client error:", error);
    return "";
  }
}

export async function getDeepReflectiveAnalysis(
  identity: UserIdentity,
  logs: DailyLog[]
): Promise<string> {
  try {
    const res = await fetch("/api/deep-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity, logs })
    });
    if (!res.ok) {
      if (res.status === 429) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "N.O.A.H Rate Limit: Too many requests.");
      }
      throw new Error("Server error on deep analysis");
    }
    const json = await res.json();
    return json.text || "Analysis interrupted. Logic buffer empty.";
  } catch (error: any) {
    console.error("Deep analysis client error:", error);
    if (error?.message && error.message.includes("Rate Limit")) {
      return error.message;
    }
    const coreResult = noahCoreEngine.process(logs);
    return "Deep reflection failed. Deterministic metrics suggest a state of " + coreResult.state + ". System authenticity is compromised.";
  }
}

export async function generateAlignmentFeedback(
  identity: UserIdentity,
  logs: DailyLog[]
): Promise<FeedbackData> {
  try {
    const res = await fetch("/api/alignment-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity, logs })
    });
    if (!res.ok) throw new Error("Server error on alignment feedback");
    const json = await res.json();
    return {
      status: json.status || "UNSTABLE",
      message: json.message || "Patterns are currently incoherent. Continue observation.",
      observation: json.observation || "Raw signals"
    };
  } catch (error) {
    console.error("Alignment feedback client error:", error);
    const coreResult = noahCoreEngine.process(logs);
    
    let deterministicStatus: 'ALIGNED' | 'UNSTABLE' | 'DRIFTING' = 'ALIGNED';
    if (coreResult.state === 'fragile') {
      deterministicStatus = 'UNSTABLE';
    } else if (coreResult.state === 'drift' || coreResult.state === 'critical') {
      deterministicStatus = 'DRIFTING';
    }

    return {
      status: deterministicStatus,
      message: "Mirror systems offline. Relying on deterministic diagnostics.",
      observation: coreResult.explanation
    };
  }
}
