
import { GoogleGenAI, Type } from "@google/genai";
import { UserIdentity, DailyLog, FeedbackData } from "../types";
import { noahCoreEngine } from "../noah-core/engine";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Audio,
                mimeType: mimeType,
              },
            },
            { text: "Transcribe the following audio precisely. Output only the transcription text, nothing else." },
          ],
        },
      ],
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription error:", error);
    return "";
  }
}

export async function getDeepReflectiveAnalysis(
  identity: UserIdentity,
  logs: DailyLog[]
): Promise<string> {
  const recentLogs = logs.slice(-14);
  const coreResult = noahCoreEngine.process(logs);
  
  const prompt = `
    SYSTEM: DEEP TRAJECTORY AUDIT [N.O.A.H CORE INTERFACE].
    
    TARGET IDENTITY: ${identity.role}
    ANCHOR COMMITMENTS: ${identity.anchors.join(', ')}
    
    DIAGNOSTIC TELEMETRY:
    - State: ${coreResult.state.toUpperCase()}
    - Core Logic: ${coreResult.explanation}
    - Authenticity Score: ${coreResult.meta.authenticity.toFixed(2)}
    
    RAW OBSERVATION DATA (Last 14 Nodes):
    ${recentLogs.map(l => `- [${l.date}] Note: "${l.note}" | Time: ${l.timeSpent}m | State: "${l.state}" | Energy: ${l.energy} | Anchors: ${l.anchorsCompleted?.filter(Boolean).length}/${l.anchorsCompleted?.length}`).join('\n')}
    
    ANALYTICAL FRAMEWORK:
    1. Check if the user's notes sound productive but their time/anchors are low.
    2. Identify the "Effort Paradox": lots of time spent but zero tasks finished.
    3. Tell the user the harsh truth about why they aren't becoming their target identity.
    
    CONSTRAINTS: 
    - Use clear, simple, but direct English.
    - Be honest and serious. No fluff.
    - Avoid over-complicated jargon. Speak like a clinical psychologist performing a case study.
    - Focus on the GAP between what they say and what they do.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });

    return response.text || "Analysis interrupted. Logic buffer empty.";
  } catch (error) {
    console.error('Deep analysis error:', error);
    return "Deep reflection failed. Deterministic metrics suggest a state of " + coreResult.state + ". System authenticity is compromised.";
  }
}

export async function generateAlignmentFeedback(
  identity: UserIdentity,
  logs: DailyLog[]
): Promise<FeedbackData> {
  if (logs.length === 0) {
    return {
      status: 'UNSTABLE',
      message: 'Initial observation required.',
      observation: 'No signal.'
    };
  }

  const coreResult = noahCoreEngine.process(logs);
  const recentLogs = logs.slice(-7);
  
  const prompt = `
    AUDIT ALIGNMENT SIGNAL.
    
    TARGET IDENTITY: ${identity.role}
    INTENDED ANCHORS: ${identity.anchors.join(', ')}
    
    SYSTEM DIAGNOSTICS: 
    - NoahCore Explanation: ${coreResult.explanation}
    
    RECENT LOG DATA:
    ${recentLogs.map(l => `- Note: "${l.note}" | Time: ${l.timeSpent}m | State: "${l.state}" | Anchors: ${l.anchorsCompleted?.filter(Boolean).length}/${l.anchorsCompleted?.length}`).join('\n')}
    
    CRITICAL INSTRUCTIONS:
    - Compare the user's Note with their Time and Anchors.
    - If they write about doing work but log 0 time or no anchors, point out the lying/dishonesty directly.
    - Be serious and direct.
    - Use simple English that is clear and easy to understand.
    - Output ONLY valid JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ['ALIGNED', 'UNSTABLE', 'DRIFTING'] },
            message: { type: Type.STRING, description: "A simple, honest summary of current alignment. Be direct about discrepancies." },
            observation: { type: Type.STRING, description: "A simple technical summary of the pattern." }
          },
          required: ['status', 'message', 'observation']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      status: result.status || 'UNSTABLE',
      message: result.message || 'Patterns are currently incoherent. Continue observation.',
      observation: result.observation || coreResult.explanation
    };
  } catch (error) {
    console.error('Gemini feedback error:', error);
    return {
      status: 'UNSTABLE',
      message: 'Mirror systems offline. Rely on deterministic diagnostics.',
      observation: coreResult.explanation
    };
  }
}
