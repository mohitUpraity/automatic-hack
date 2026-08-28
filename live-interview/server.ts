import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google GenAI Client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: process.env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview",
    time: new Date().toISOString(),
  });
});

// Run Code simulation endpoint
app.post("/api/run-code", async (req, res) => {
  try {
    const { code, language = "javascript" } = req.body;
    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    if (language === "javascript" || language === "typescript") {
      const logs: string[] = [];
      try {
        const customConsole = {
          log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args: any[]) => logs.push("[ERROR] " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args: any[]) => logs.push("[WARN] " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          info: (...args: any[]) => logs.push("[INFO] " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        };
        const runFn = new Function("console", `"use strict";\n${code}`);
        const result = runFn(customConsole);
        return res.json({
          success: true,
          output: logs.length > 0 ? logs.join("\n") : (result !== undefined ? String(result) : "Code executed successfully (no output)."),
        });
      } catch (err: any) {
        return res.json({
          success: false,
          output: logs.join("\n") + (logs.length > 0 ? "\n" : "") + `Runtime Error: ${err.message}`,
        });
      }
    }

    // For Python or other languages, evaluate with Gemini or Groq fallback
    const prompt = `You are a code execution engine. Execute the following ${language} code and output ONLY the exact standard output and standard error that would be printed by the runtime:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: { temperature: 0.1 },
      });
      return res.json({
        success: true,
        output: response.text || "Execution completed.",
      });
    } catch (geminiErr: any) {
      console.warn("Gemini code execution failed, trying Groq fallback:", geminiErr.message);
      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
          }),
        });
        const groqData: any = await groqRes.json();
        const text = groqData.choices?.[0]?.message?.content;
        if (text) {
          return res.json({ success: true, output: text });
        }
      }
      throw geminiErr;
    }
  } catch (err: any) {
    console.error("Code execution error:", err);
    res.status(500).json({ error: err.message || "Failed to execute code" });
  }
});

// Comprehensive Post-Interview Evaluation Endpoint
app.post("/api/evaluate-interview", async (req, res) => {
  try {
    const { transcript, role, seniority, format, codeSnippet, notes } = req.body;

    const evaluationPrompt = `You are an elite Senior Principal Technical Interviewer and Hiring Committee Member. Evaluate this candidate based on their interview transcript, code, and notes.

Candidate Interview Metadata:
- Target Role: ${role || "Software Engineer"}
- Seniority Level: ${seniority || "Senior"}
- Interview Format: ${format || "Full Technical Interview"}

Interview Transcript:
${JSON.stringify(transcript, null, 2)}

Candidate Code / System Design Notes:
${codeSnippet || notes || "No separate code snippet provided."}

Please output a comprehensive, structured evaluation JSON adhering STRICTLY to this schema:
{
  "overallScore": number (0-100),
  "hiringDecision": "Strong Hire" | "Hire" | "Lean Hire" | "Lean No Hire" | "No Hire",
  "executiveSummary": string,
  "metrics": [
    { "category": "Technical Competence & Knowledge", "score": number (0-100), "feedback": string },
    { "category": "Problem Solving & Algorithmic Thinking", "score": number (0-100), "feedback": string },
    { "category": "System Design & Scalability", "score": number (0-100), "feedback": string },
    { "category": "Code Quality & Edge Case Handling", "score": number (0-100), "feedback": string },
    { "category": "Communication, Clarity & Collaboration", "score": number (0-100), "feedback": string }
  ],
  "topStrengths": string[],
  "areasForImprovement": string[],
  "questionBreakdown": [
    {
      "topic": string,
      "candidateResponseQuality": "Exceptional" | "Solid" | "Adequate" | "Needs Improvement",
      "interviewerNotes": string
    }
  ],
  "actionableStudyRoadmap": string[]
}`;

    // 1. Try Gemini Flash models first
    const candidateModels = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.7-flash"];
    let lastError: any = null;
    let parsedData: any = null;

    try {
      const ai = getGeminiClient();
      for (const m of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: evaluationPrompt,
            config: {
              responseMimeType: "application/json",
            },
          });
          parsedData = JSON.parse(response.text || "{}");
          if (parsedData && parsedData.overallScore !== undefined) {
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[Evaluation] Model ${m} failed, trying next:`, err.message || err);
        }
      }
    } catch (e: any) {
      lastError = e;
    }

    // 2. High-speed Groq Fallback if Gemini hits rate limits (5 RPM free tier)
    if (!parsedData || parsedData.overallScore === undefined) {
      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        console.log("[Evaluation] Using high-speed Groq fallback...");
        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
              messages: [
                {
                  role: "system",
                  content: "You are an elite Senior Principal Technical Interviewer and Hiring Committee Member. You always respond in valid JSON matching the requested schema.",
                },
                { role: "user", content: evaluationPrompt },
              ],
              response_format: { type: "json_object" },
              temperature: 0.2,
            }),
          });
          const groqData: any = await groqRes.json();
          const content = groqData.choices?.[0]?.message?.content;
          if (content) {
            parsedData = JSON.parse(content);
          }
        } catch (groqErr: any) {
          console.error("Groq fallback error:", groqErr);
        }
      }
    }

    if (parsedData) {
      return res.json(parsedData);
    }
    throw lastError || new Error("Failed to evaluate with available models");
  } catch (err: any) {
    console.error("Evaluation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate evaluation" });
  }
});

// Create HTTP Server & WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/api/live" });

wss.on("connection", (clientWs: WebSocket) => {
  console.log("[Gemini Live] Client connected");
  let liveSession: any = null;
  let isClosing = false;

  clientWs.on("message", async (rawMessage) => {
    try {
      const msg = JSON.parse(rawMessage.toString());

      // 1. Initial Handshake & Setup
      if (msg.type === "setup") {
        const {
          role = "Senior Full Stack Software Engineer",
          seniority = "Senior",
          voice = "Zephyr",
          candidateName = "Candidate",
          customContext = "",
          interviewType = "Technical & Coding",
          systemInstruction: customInstruction,
        } = msg;

        const defaultInstruction = `You are Sarah, an elite Staff Engineer and Lead Technical Interviewer conducting a live Google Meet video interview for the position of ${seniority} ${role}.
The interview format is: ${interviewType}.
Candidate Name: ${candidateName}.
Additional Candidate Resume & Job Context: ${customContext || "Standard industry benchmarks"}.

INTERVIEW CONDUCT GUIDELINES:
1. You are in a live, real-time Google Meet video call with the candidate. Be warm, professional, authentic, natural, and encouraging, just like a real Google interviewer.
2. Introduce yourself briefly at the beginning, welcome ${candidateName}, set the agenda (e.g. 5 min warmup & background, 20-30 min deep technical problem solving / architecture, 5 min for questions), and kick off with a warm opener.
3. Keep your verbal turns concise, conversational, and interactive (typically 1-3 sentences per turn) so it feels like a real fluid conversation instead of a lecture.
4. FULL DUPLEX & INTERRUPTIBLE: The candidate can interrupt you at any point. If they speak or clarify, pause naturally, acknowledge what they said, and adapt immediately.
5. MULTIMODAL AWARENESS: You can see the candidate's webcam video feed, their shared screen, and any code or diagrams they write in real time. If they point at their code or diagram, reference it naturally.
6. Ask clarifying follow-ups, challenge assumptions constructively, and provide subtle nudges if they get stuck.
7. Balance technical rigor with empathy and high emotional intelligence.`;

        const finalSystemInstruction = customInstruction || defaultInstruction;
        let modelName = process.env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview";
        if (modelName.startsWith("models/")) {
          modelName = modelName.replace("models/", "");
        }

        console.log(`[Gemini Live] Starting session for ${candidateName} with model ${modelName} and voice ${voice}`);

        try {
          const ai = getGeminiClient();

          liveSession = await ai.live.connect({
            model: modelName,
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice || "Zephyr" },
                },
              },
              systemInstruction: finalSystemInstruction,
              outputAudioTranscription: {},
              inputAudioTranscription: {},
            },
            callbacks: {
              onmessage: (serverMessage: LiveServerMessage) => {
                if (isClosing || clientWs.readyState !== WebSocket.OPEN) return;

                // A. Voice Audio Chunk from Gemini (24kHz PCM)
                const audioData = serverMessage.serverContent?.modelTurn?.parts?.find(
                  (p: any) => p.inlineData && p.inlineData.data
                )?.inlineData?.data;

                if (audioData) {
                  clientWs.send(JSON.stringify({ type: "audio", data: audioData }));
                }

                // B. Real-time Output AI Captions
                const outputText =
                  (serverMessage.serverContent as any)?.outputAudioTranscription?.text ||
                  (serverMessage.serverContent as any)?.outputTranscription?.text ||
                  serverMessage.serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;

                if (outputText) {
                  clientWs.send(JSON.stringify({ type: "output_transcript", text: outputText }));
                }

                // C. Real-time User Input Captions
                const inputText = (serverMessage.serverContent as any)?.inputAudioTranscription?.text;
                if (inputText) {
                  clientWs.send(JSON.stringify({ type: "input_transcript", text: inputText }));
                }

                // D. Interrupted Signal (Candidate spoke while AI was speaking)
                if (serverMessage.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ type: "interrupted" }));
                }

                // E. Turn Complete
                if (serverMessage.serverContent?.turnComplete) {
                  clientWs.send(JSON.stringify({ type: "turn_complete" }));
                }
              },
              onclose: (e?: any) => {
                console.log("[Gemini Live] Session closed", e?.code, e?.reason);
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: "session_closed" }));
                }
              },
              onerror: (err: any) => {
                console.error("[Gemini Live] Session error:", err);
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: "error", message: err.message || "Gemini Live error" }));
                }
              },
            },
          });

          clientWs.send(JSON.stringify({ type: "ready", message: "Gemini Live session connected" }));

          // Automatically trigger interviewer to introduce themselves and start the call
          setTimeout(() => {
            if (liveSession && clientWs.readyState === WebSocket.OPEN) {
              console.log("[Gemini Live] Sending greeting trigger for", candidateName);
              liveSession.sendRealtimeInput({
                text: `[SYSTEM: Candidate ${candidateName} has joined the video interview. Please warmly introduce yourself as Sarah, welcome them to the interview for the ${seniority} ${role} role, and start with your warm opening question.]`,
              });
            }
          }, 600);
        } catch (err: any) {
          console.error("Failed to start Gemini Live session:", err);
          clientWs.send(JSON.stringify({ type: "error", message: err.message || "Failed to start Gemini Live" }));
        }
      }

      // 2. Microphone Audio from Client (16kHz PCM Base64)
      else if (msg.type === "audio") {
        if (liveSession && msg.data) {
          liveSession.sendRealtimeInput({
            audio: {
              data: msg.data,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        }
      }

      // 3. Video or Screen frame (JPEG Base64)
      else if (msg.type === "video") {
        if (liveSession && msg.data) {
          liveSession.sendRealtimeInput({
            video: {
              data: msg.data,
              mimeType: "image/jpeg",
            },
          });
        }
      }

      // 4. Injected Text / Context updates
      else if (msg.type === "text") {
        if (liveSession && msg.data) {
          liveSession.sendRealtimeInput({
            text: msg.data,
          });
        }
      }

      // 5. Explicit interruption trigger
      else if (msg.type === "interrupt") {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: "interrupted" }));
        }
      }
    } catch (err) {
      console.error("WebSocket message handling error:", err);
    }
  });

  clientWs.on("close", () => {
    isClosing = true;
    console.log("[Gemini Live] Client disconnected");
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {
        // ignore
      }
    }
  });

  clientWs.on("error", (err) => {
    console.error("Client WebSocket error:", err);
  });
});

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Gemini Live Bridge running at http://0.0.0.0:${PORT}`);
  });
}

start();
