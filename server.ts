import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { noahCoreEngine } from "./noah-core/engine";

// Lazy initialize Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy settings to correctly identify client IPs behind nginx / cloud run proxies
  app.set("trust proxy", true);

  // Simple in-memory rate limiting store for Deep Analysis
  const deepAnalysisStore: Record<string, number[]> = {};
  const LIMIT_PER_DAY = 2;
  const WINDOW_MS = 24 * 60 * 60 * 1000; // 24-hour rolling window

  // Middleware for parsing requests
  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { base64Audio, mimeType } = req.body;
      const ai = getAi();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Transcription API error:", error);
      res.status(500).json({ error: error.message || "Transcription failed" });
    }
  });

  app.post("/api/deep-analysis", async (req, res) => {
    try {
      const clientIp = (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : req.ip || '127.0.0.1');

      const now = Date.now();
      if (!deepAnalysisStore[clientIp]) {
        deepAnalysisStore[clientIp] = [];
      }

      // Filter outdated timestamps from rolling 24-hour window
      deepAnalysisStore[clientIp] = deepAnalysisStore[clientIp].filter(t => now - t < WINDOW_MS);

      if (deepAnalysisStore[clientIp].length >= LIMIT_PER_DAY) {
        const oldest = deepAnalysisStore[clientIp][0];
        const remainingMs = oldest + WINDOW_MS - now;
        const resetHours = Math.ceil(remainingMs / (60 * 60 * 1000));
        return res.status(429).json({ 
          error: `N.O.A.H Rate Limit: Deep audits are limited to 2 sessions per 24h to preserve resources. Try again in ${resetHours} hour${resetHours > 1 ? 's' : ''}.` 
        });
      }

      const { identity, logs } = req.body;
      const recentLogs = logs.slice(-14);
      const coreResult = noahCoreEngine.process(logs);
      
      let friendlyStatus = 'ALIGNED';
      if (coreResult.state === 'fragile') {
        friendlyStatus = 'UNSTABLE';
      } else if (coreResult.state === 'drift' || coreResult.state === 'critical') {
        friendlyStatus = 'DRIFTING';
      }

      const logCount = logs.length;
      
      const prompt = `
        SYSTEM: DEEP TRAJECTORY AUDIT [N.O.A.H CORE INTERFACE].
        
        TARGET IDENTITY: ${identity.role}
        ANCHOR COMMITMENTS: ${identity.anchors.join(', ')}
        OBSERVATION PERIOD DAY: ${logCount} / 30
        
        DIAGNOSTIC TELEMETRY:
        - Unised State Label: ${friendlyStatus} (${coreResult.state.toUpperCase()})
        - Core Logic: ${coreResult.explanation}
        - Authenticity Score: ${coreResult.meta.authenticity.toFixed(2)}
        
        RAW OBSERVATION DATA (Last 14 Nodes):
        ${recentLogs.map((l: any) => `- [${l.date}] Note: "${l.note}" | Time: ${l.timeSpent}m | State: "${l.state}" | Energy: ${l.energy} | Anchors: ${l?.anchorsCompleted?.filter(Boolean).length || 0}/${l?.anchorsCompleted?.length || 0}`).join('\n')}
        
        ANALYTICAL FRAMEWORK & TEMPERAMENT RULES:
        1. Check if the user's notes sound productive but their time/anchors are low.
        2. Identify the "Effort Paradox": lots of time spent but zero tasks finished.
        3. Report the objective truth about their trajectory. 
        4. CRITICAL INSTRUCTION - OBJECTIVE CONSTAT: Constated the raw facts without making speculative judgments about their entire personality or character. If this is early in their observation (Days 1 to 3), explicitly state that no definitive pattern exists yet, and avoid using definitive phrases like "you are not [identity]" or "you prevent yourself from becoming". Frame it strictly as an early warning or early point of comparison rather than an ultimate psychological diagnosis.
        
        CONSTRAINTS: 
        - Use clear, simple, but direct English.
        - Be honest and serious. No room for sugarcoating, but definitely no dramatic over-judging either.
        - Avoid over-complicated jargon. Speak like a clinical psychologist performing an objective case study.
        - Focus on the GAP between what they claimed to do and what they actually logged.
      `;

      const ai = getAi();
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingBudget: 32768,
          },
        },
      });

      // Record successful request in-memory rate-limiter
      deepAnalysisStore[clientIp].push(now);

      res.json({ text: response.text || "Analysis interrupted. Logic buffer empty." });
    } catch (error: any) {
      console.error("Deep analysis API error:", error);
      res.status(500).json({ error: error.message || "Deep analysis failed" });
    }
  });

  app.post("/api/alignment-feedback", async (req, res) => {
    try {
      const { identity, logs } = req.body;
      if (!logs || logs.length === 0) {
        return res.json({
          status: 'UNSTABLE',
          message: 'Initial observation required.',
          observation: 'No signal.'
        });
      }

      const coreResult = noahCoreEngine.process(logs);
      const recentLogs = logs.slice(-7);
      
      // Calculate deterministic client status
      let deterministicStatus = 'ALIGNED';
      if (coreResult.state === 'calibrating') {
        deterministicStatus = 'CALIBRATING';
      } else if (coreResult.state === 'fragile') {
        deterministicStatus = 'UNSTABLE';
      } else if (coreResult.state === 'drift' || coreResult.state === 'critical') {
        deterministicStatus = 'DRIFTING';
      }

      const logCount = logs.length;

      const prompt = `
        AUDIT ALIGNMENT SIGNAL.
        
        TARGET IDENTITY: ${identity.role}
        INTENDED ANCHORS: ${identity.anchors.join(', ')}
        OBSERVATION PERIOD DAY: ${logCount} / 30
        
        SYSTEM DIAGNOSTICS: 
        - NoahCore Explanation: ${coreResult.explanation}
        - Determined Alignment Status: ${deterministicStatus}
        
        RECENT LOG DATA:
        ${recentLogs.map((l: any) => `- Note: "${l.note}" | Time: ${l.timeSpent}m | State: "${l.state}" | Anchors: ${l?.anchorsCompleted?.filter(Boolean).length || 0}/${l?.anchorsCompleted?.length || 0}`).join('\n')}
        
        CRITICAL INSTRUCTIONS:
        - Compare the user's Note with their Time and Anchors.
        - If they write about doing work but log 0 time or no anchors, point out the discrepancy clearly and honestly.
        - The user is deterministically classified with status: "${deterministicStatus}".
        - Your analysis and explanation must speak to this status directly. Do not invent a different status.
        - Be objective. If it is only day 1-3 of their observation, evaluate today's metrics without making sweeping conclusions about their identity. Point out immediate successes or discrepancies strictly as single-day facts.
        - Be serious and direct.
        - Use simple English that is clear and easy to understand.
        - Output ONLY valid JSON matching the schema.
      `;

      const ai = getAi();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: { type: Type.STRING, description: `A simple, honest summary of current alignment matching the determined status ("${deterministicStatus}"). Be direct about discrepancies.` },
              observation: { type: Type.STRING, description: "A simple technical summary of the pattern." }
            },
            required: ['message', 'observation']
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      res.json({
        status: deterministicStatus, // Overriding and strictly defining status on the server side
        message: result.message || 'Patterns are currently incoherent. Continue observation.',
        observation: result.observation || coreResult.explanation
      });
    } catch (error: any) {
      console.error("Alignment feedback API error:", error);
      res.status(500).json({ error: error.message || "Feedback generation failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
