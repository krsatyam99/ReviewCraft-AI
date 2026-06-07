import React, { useState, useEffect } from 'react';

function App() {
  const [workLog, setWorkLog] = useState('');
  const [activeTab, setActiveTab] = useState('resume');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [outputs, setOutputs] = useState({
    resume: 'Waiting for data...',
    appraisal: 'Waiting for data...',
    linkedin: 'Waiting for data...'
  });

  useEffect(() => {
    const saved = localStorage.getItem('reviewcraft_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleTransform = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!workLog.trim()) {
      setErrorMessage("Please enter your work logs first.");
      return;
    }

    setIsLoading(true);

    const KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
    const URL = "https://openrouter.ai/api/v1/chat/completions";

    try {
      const response = await fetch(URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "ReviewCraft"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-70b-instruct",  // ✅ upgraded model
          messages: [{
            role: "user",
            content: `You are a career coach. You must REWRITE and TRANSFORM the work logs below — do NOT copy them verbatim.

  Return a JSON object with EXACTLY these 3 keys:

  "resume": A string with 2-3 bullet points using strong action verbs like "Delivered", "Optimized", "Spearheaded". Use the XYZ formula: Accomplished [X] by doing [Y] resulting in [Z].
  "appraisal": A string with a 2-3 sentence first-person paragraph starting with "I ".
  "linkedin": A string with a short post ending with 3 hashtags like #Engineering #Leadership #Impact.

  Rules:
  - Values must be strings, NOT arrays
  - Never use null or empty arrays
  - Never copy the original logs word for word
  - Return ONLY raw JSON, no markdown

  Work Logs: ${workLog}`
          }]
        })
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error.message || "API Error");

      const content = data.choices[0].message.content;

      console.log("Extracted Content:", content);

      const startIndex = content.indexOf('{');
      const endIndex = content.lastIndexOf('}');

      if (startIndex === -1 || endIndex === -1) {
        throw new Error("AI returned data, but it wasn't valid JSON.");
      }

      const jsonStr = content.substring(startIndex, endIndex + 1);
      const json = JSON.parse(jsonStr);

      setOutputs(json);
      setHistory([{ id: Date.now(), log: workLog }, ...history]);
      localStorage.setItem('reviewcraft_history', JSON.stringify([{ id: Date.now(), log: workLog }, ...history]));

    } catch (err) {
      console.error("Pipeline Error:", err);
      setErrorMessage("Pipeline Failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <h1 className="text-2xl font-bold mb-6 text-cyan-400">ReviewCraft AI</h1>

      {errorMessage && (
        <div className="bg-red-900 border border-red-500 text-red-100 p-4 mb-4 rounded">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <textarea
            className="w-full h-64 bg-slate-950 border border-slate-700 p-4 rounded text-sm text-slate-100"
            value={workLog}
            onChange={(e) => setWorkLog(e.target.value)}
            placeholder="Paste your work logs here..."
          />
          <button
            onClick={handleTransform}
            disabled={isLoading}
            className="w-full mt-2 bg-cyan-600 p-2 rounded font-bold hover:bg-cyan-500 transition disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Craft Narrative"}
          </button>
        </div>

        <div className="lg:col-span-2 bg-slate-950 p-6 rounded border border-slate-700">
          <div className="flex gap-4 mb-4">
            {['resume', 'appraisal', 'linkedin'].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`capitalize px-4 py-1 border-b-2 ${activeTab === t ? 'border-cyan-500' : 'border-transparent'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="bg-slate-900 p-4 rounded min-h-[200px] text-sm whitespace-pre-line mb-4 border border-slate-800">
            {outputs[activeTab]}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;