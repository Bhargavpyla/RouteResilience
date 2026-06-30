import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API Endpoint: AI Scenario Planning Advisory Brief
app.post("/api/analyze-scenario", async (req, res) => {
  const { ablatedNodes, baselinePath, detourPath, resilienceIndex, detourPercentage, healedGaps } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({
      success: false,
      error: "Gemini API key is missing. Please configure it in the Secrets panel."
    });
  }

  try {
    const prompt = `
    You are an Expert Geospatial AI Consultant & Lead Graph Theorist advising a city's Department of Transportation.
    An urban mobility stress test has been performed on a district's road network, which was extracted from occluded satellite images and topologically healed.
    
    Here is the telemetry of the active stress test scenario:
    - **Ablated Nodes (Simulated Outages / Roadblocks):** [${ablatedNodes?.join(", ") || "None"}]
    - **Healed Road Segments (Cloud/Canopy Gaps Solved):** [${healedGaps?.join(", ") || "None"}]
    - **Network Resilience Index (R):** ${resilienceIndex?.toFixed(3) || "1.000"} (Scale: 0.0 to 1.0, where 1.0 is perfectly redundant)
    - **Average Travel Time/Distance Increase:** +${detourPercentage?.toFixed(1) || "0.0"}%
    - **Baseline Shortest Route (Origin to Destination):** [${baselinePath?.join(" ➔ ") || "Direct Corridors"}]
    - **Current Perturbed Shortest Route:** [${detourPath?.join(" ➔ ") || "Isolated/No Path"}]

    Please generate a highly structured, professional, and actionable Strategic Urban Mobility Advisory Brief. 
    Format the output in clean, readable Markdown without any introductory or concluding chatter. Structure your response into exactly three sections:
    
    ### 1. 🔍 Vulnerability & Criticality Analysis
    Evaluate why the ablated junctions (especially any high-centrality ones like Node E) represent single points of failure. Detail the specific cascade effects on the surrounding corridors.
    
    ### 2. 🔀 Detour Routing and Transit Flow Evaluation
    Analyze the current detour path versus the baseline. Mention the travel time increase factor and evaluate whether the secondary pathways can handle redirected peak-hour volume or if they risk secondary gridlock.
    
    ### 3. 🛡️ Mitigation & Redundancy Investment Recommendations
    Provide concrete civil engineering and technological solutions: e.g., smart signals, adding redundant parallel pathways, transit lane policies, or prioritizing topological healing corridors.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      analysis: response.text,
    });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate AI resilience analysis.",
    });
  }
});

// Setup Vite Dev Server / Production Serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Vite] Middleware registered successfully in Development Mode");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[Vite] Serving static assets in Production Mode");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Route Resilience server is online at http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to boot full-stack server:", err);
});
