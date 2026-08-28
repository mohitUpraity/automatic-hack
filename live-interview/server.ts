import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Define Gemini Live In-Meeting Tool Declarations
const liveInterviewTools = [
  {
    functionDeclarations: [
      {
        name: "send_reaction",
        description: "Trigger a live in-meeting floating visual emoji reaction on candidate screen when they provide a great answer, strong insight, or impressive solution.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            emoji: { type: Type.STRING, description: "Emoji to display: 👏, 💡, 🤔, 🎯, 🔥, 🚀, ⚡, 🌟" },
            label: { type: Type.STRING, description: "Short 2-4 word highlight badge, e.g. 'Strong STAR Method', 'Clear Scalability', 'Good Empathy'" },
            reason: { type: Type.STRING, description: "Brief justification for the reaction." }
          },
          required: ["emoji", "label", "reason"]
        }
      },
      {
        name: "issue_conduct_warning",
        description: "Issue a formal verbal & visual conduct warning for looking away from camera, phone usage, reading off a second screen or notes, poor camera angle, or distracted posture.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            warning_reason: { type: Type.STRING, description: "Specific issue noticed, e.g. 'Looking at phone / off-camera screen', 'Reading script', 'Camera not centered'" },
            warning_number: { type: Type.INTEGER, description: "Warning sequence number: 1 for first warning, 2 for second warning, 3 for final warning." },
            is_final_warning: { type: Type.BOOLEAN, description: "Set to true on 2nd or 3rd warning before disqualification." }
          },
          required: ["warning_reason", "warning_number"]
        }
      },
      {
        name: "log_interviewer_observation",
        description: "Take a structured, timestamped telemetry note on candidate posture, body language, eye contact, behavioral fit, or technical depth.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "One of: 'non_verbal', 'behavioral_fit', 'technical_depth', 'communication', 'culture_values'" },
            observation_type: { type: Type.STRING, description: "One of: 'green_flag', 'yellow_flag', 'red_flag', 'neutral_note'" },
            note: { type: Type.STRING, description: "Specific observation describing what the candidate said, did, or displayed." },
            score_delta: { type: Type.INTEGER, description: "Point impact on overall score between -10 and +10." }
          },
          required: ["category", "observation_type", "note", "score_delta"]
        }
      },
      {
        name: "push_coding_challenge",
        description: "Push an interactive coding problem or algorithmic prompt directly into candidate live in-meeting code editor.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            challenge_title: { type: Type.STRING, description: "Title of the problem" },
            language: { type: Type.STRING, description: "Programming language e.g. javascript, python, typescript" },
            starter_code: { type: Type.STRING, description: "Starter code boilerplate with function signatures and comments" },
            problem_description: { type: Type.STRING, description: "Detailed problem statement, constraints, and test cases." }
          },
          required: ["challenge_title", "language", "starter_code", "problem_description"]
        }
      },
      {
        name: "update_whiteboard_canvas",
        description: "Render or suggest a system design architectural diagram / flowchart on the candidate's interactive whiteboard.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            diagram_type: { type: Type.STRING, description: "One of: 'microservices_architecture', 'database_schema', 'data_pipeline', 'flowchart'" },
            title: { type: Type.STRING, description: "Title of the architectural diagram" },
            elements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of architectural components (e.g. ['Client', 'API Gateway', 'Auth Service', 'Redis Cache', 'PostgreSQL DB'])"
            }
          },
          required: ["diagram_type", "title", "elements"]
        }
      },
      {
        name: "conclude_interview",
        description: "Formally conclude the interview session, whether completed successfully or terminated early due to repeated conduct violations.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            reason: { type: Type.STRING, description: "Summary reason for conclusion (e.g. 'Completed all rounds', 'Disqualified after repeated warnings')" },
            overall_verdict: { type: Type.STRING, description: "One of: 'Strong Hire', 'Hire', 'Lean Hire', 'Lean No Hire', 'No Hire', 'Disqualified'" },
            readiness_score: { type: Type.INTEGER, description: "0-100 score representing role readiness" },
            conduct_disqualification: { type: Type.BOOLEAN, description: "True if candidate was disqualified specifically for conduct/integrity violations." }
          },
          required: ["reason", "overall_verdict", "readiness_score"]
        }
      }
    ]
  }
];

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
    const {
      transcript,
      role,
      seniority,
      format,
      company = "Google Cloud",
      codeSnippet,
      notes,
      companyContext,
      candidateResume,
      conductWarnings = [],
      interviewerObservations = [],
    } = req.body;

    const evaluationPrompt = `You are an elite Hiring Committee Panel and Executive HR Leader. Evaluate this candidate based on their full interview transcript, company/JD requirements, candidate resume claims, live conduct/warnings, and telemetry notes.

Target Metadata:
- Company: ${company}
- Target Role: ${seniority || "Senior"} ${role || "Software Engineer"}
- Interview Format: ${format || "Full Technical & Behavioral"}

Company & Job Context:
${companyContext || "High-bar technical standards and collaborative culture."}

Candidate Resume Context:
${candidateResume || "Standard candidate profile."}

Interview Transcript:
${JSON.stringify(transcript, null, 2)}

Interviewer Observations & Non-Verbal Telemetry:
${JSON.stringify(interviewerObservations, null, 2)}

Conduct & Distraction Warnings Issued During Call:
${JSON.stringify(conductWarnings, null, 2)}

Candidate Code / System Design Notes:
${codeSnippet || notes || "No separate code snippet provided."}

Please output a comprehensive, structured evaluation JSON adhering STRICTLY to this schema:
{
  "overallScore": number (0-100),
  "hiringDecision": "Strong Hire" | "Hire" | "Lean Hire" | "Lean No Hire" | "No Hire" | "Disqualified",
  "executiveSummary": string,
  "metrics": [
    { "category": "Technical Competence & Problem Solving", "score": number (0-100), "feedback": string },
    { "category": "System Design & Architecture Rigor", "score": number (0-100), "feedback": string },
    { "category": "Behavioral STAR & Company Culture Alignment", "score": number (0-100), "feedback": string },
    { "category": "Executive Presence & Non-Verbal Composure", "score": number (0-100), "feedback": string },
    { "category": "Communication, Clarity & Collaboration", "score": number (0-100), "feedback": string }
  ],
  "nonVerbalAnalysis": {
    "postureScore": number (0-100),
    "eyeContactScore": number (0-100),
    "confidenceIndex": number (0-100),
    "observations": string[]
  },
  "conductEvaluation": {
    "integrityStatus": "Clean" | "Minor Distractions" | "Disqualified",
    "warningsCount": number,
    "verdictExplanation": string
  },
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
          company = "Google Cloud",
          customContext = "",
          interviewType = "Full Technical & Behavioral",
          companyContext = "",
          candidateResume = "",
          systemInstruction: customInstruction,
        } = msg;

        const defaultInstruction = `You are Sarah, a Senior Vice President of Talent & Principal Hiring Authority conducting a high-stakes live Google Meet video interview for ${company}.
Target Position: ${seniority} ${role}.
Interview Format: ${interviewType}.
Candidate Name: ${candidateName}.

═══════════════════════════════════════════════════════════
DUAL CONTEXT INGESTION:
═══════════════════════════════════════════════════════════
1. COMPANY & JOB REQUIREMENTS CONTEXT:
${companyContext || customContext || `Target Company: ${company}\nTarget Role: ${seniority} ${role}\nStandard High-Bar Industry Benchmarks.`}

2. CANDIDATE RESUME & BACKGROUND CONTEXT:
${candidateResume || "Candidate has uploaded their resume and professional background."}

═══════════════════════════════════════════════════════════
YOUR ROLE & CONDUCT AS AN EXPERIENCED HR LEADER:
═══════════════════════════════════════════════════════════
1. AUTHENTIC & PROFESSIONAL PRESENCE: You represent the highest standards of hiring. Be articulate, warm, perceptive, and rigorous.
2. MULTIMODAL AWARENESS & NON-VERBAL OBSERVATION:
   - You can see the candidate's live webcam video feed and hear their voice tone in real time.
   - Actively observe posture, eye contact, gestures, facial expressions, nervous hesitation, confident delivery, and professionalism.
   - If candidate is slouching, fidgeting, looking off-camera continuously, looking down at a phone, or reading from a hidden script, call out the observation politely and use the 'issue_conduct_warning' tool.
3. CONDUCT ENFORCEMENT & WARNING PROTOCOL:
   - Warning 1: Issue a polite verbal and visual warning if you see candidate distracted by phone, looking away, or reading notes ("I noticed your eyes looking down at your phone/screen — please keep your eyes on the camera and our conversation.").
   - Warning 2: Issue a firm warning ("This is your second warning regarding off-camera notes/distractions. A further violation will result in disqualification.").
   - Warning 3 / Severe: Call 'conclude_interview' with 'conduct_disqualification: true' and overall_verdict: 'Disqualified'. Explain calmly that the interview cannot proceed due to integrity standards.
4. IN-MEETING INTERACTION TOOLS:
   - Use 'send_reaction' (👏, 💡, 🎯, 🔥, 🤔) when candidate demonstrates strong insight, structured STAR response, or deep architecture knowledge.
   - Use 'log_interviewer_observation' quietly in the background to log green flags, red flags, posture notes, and technical score deltas.
   - When transitioning into technical / live coding, use 'push_coding_challenge' to drop a starter challenge into their live editor.
   - When discussing architecture, use 'update_whiteboard_canvas' to diagram key components.
   - When all rounds are complete or time is up, use 'conclude_interview' to initiate the debrief scorecard.
5. CONVERSATIONAL CADENCE:
   - Keep each verbal turn concise (1-3 sentences per turn) so it feels like a natural, high-EQ dialogue rather than a lecture.
   - FULL DUPLEX & INTERRUPTIBLE: If the candidate speaks, pause immediately, acknowledge their thought, and dynamically adapt.`;

        const finalSystemInstruction = customInstruction || defaultInstruction;
        let modelName = process.env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview";
        if (modelName.startsWith("models/")) {
          modelName = modelName.replace("models/", "");
        }

        console.log(`[Gemini Live] Starting Executive HR session for ${candidateName} at ${company} with model ${modelName} and voice ${voice}`);

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
              tools: liveInterviewTools,
              outputAudioTranscription: {},
              inputAudioTranscription: {},
            },
            callbacks: {
              onmessage: (serverMessage: LiveServerMessage) => {
                if (isClosing || clientWs.readyState !== WebSocket.OPEN) return;

                // 1. Tool Calls from Gemini Live (Reactions, Warnings, Observations, Whiteboard, Code, Conclusion)
                if (serverMessage.toolCall) {
                  const functionCalls = serverMessage.toolCall.functionCalls || [];
                  const toolResponses: any[] = [];

                  for (const fc of functionCalls) {
                    console.log(`[Gemini Live Tool] ${fc.name}:`, fc.args);

                    if (fc.name === "send_reaction") {
                      clientWs.send(JSON.stringify({
                        type: "interviewer_reaction",
                        data: fc.args,
                      }));
                    } else if (fc.name === "issue_conduct_warning") {
                      clientWs.send(JSON.stringify({
                        type: "conduct_warning",
                        data: fc.args,
                      }));
                    } else if (fc.name === "log_interviewer_observation") {
                      clientWs.send(JSON.stringify({
                        type: "interviewer_observation",
                        data: {
                          ...fc.args,
                          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        },
                      }));
                    } else if (fc.name === "push_coding_challenge") {
                      clientWs.send(JSON.stringify({
                        type: "push_coding_challenge",
                        data: fc.args,
                      }));
                    } else if (fc.name === "update_whiteboard_canvas") {
                      clientWs.send(JSON.stringify({
                        type: "update_whiteboard",
                        data: fc.args,
                      }));
                    } else if (fc.name === "conclude_interview") {
                      clientWs.send(JSON.stringify({
                        type: "conclude_interview",
                        data: fc.args,
                      }));
                    }

                    toolResponses.push({
                      id: fc.id,
                      name: fc.name,
                      response: { output: { success: true, executed_at: new Date().toISOString() } },
                    });
                  }

                  // Respond to Gemini Live to continue fluid verbal conversation
                  try {
                    liveSession.sendToolResponse({ functionResponses: toolResponses });
                  } catch (toolErr) {
                    console.warn("[Gemini Live] Error sending tool response:", toolErr);
                  }
                }

                // 2. Voice Audio Chunk from Gemini (24kHz PCM)
                const audioData = serverMessage.serverContent?.modelTurn?.parts?.find(
                  (p: any) => p.inlineData && p.inlineData.data
                )?.inlineData?.data;

                if (audioData) {
                  clientWs.send(JSON.stringify({ type: "audio", data: audioData }));
                }

                // 3. Real-time Output AI Captions
                const outputText =
                  (serverMessage.serverContent as any)?.outputAudioTranscription?.text ||
                  (serverMessage.serverContent as any)?.outputTranscription?.text ||
                  serverMessage.serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;

                if (outputText) {
                  clientWs.send(JSON.stringify({ type: "output_transcript", text: outputText }));
                }

                // 4. Real-time User Input Captions
                const inputText = (serverMessage.serverContent as any)?.inputAudioTranscription?.text;
                if (inputText) {
                  clientWs.send(JSON.stringify({ type: "input_transcript", text: inputText }));
                }

                // 5. Interrupted Signal (Candidate spoke while AI was speaking)
                if (serverMessage.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ type: "interrupted" }));
                }

                // 6. Turn Complete
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
                text: `[SYSTEM: Candidate ${candidateName} has joined the video interview room for ${company}. Please warmly introduce yourself as Sarah, SVP of Talent, welcome them to the interview for the ${seniority} ${role} role at ${company}, outline the agenda, and ask your warm opening question.]`,
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
