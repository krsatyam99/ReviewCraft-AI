import React, { useState, useEffect } from 'react';

function App() {
  // 1. STATE MANAGEMENT
  const [workLog, setWorkLog] = useState('');
  const [activeTab, setActiveTab] = useState('resume'); 
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [outputs, setOutputs] = useState({
    resume: 'Your AI-optimized resume bullet points will appear here...',
    appraisal: 'Your structured self-appraisal text will appear here...',
    linkedin: 'Your engaging LinkedIn post variant will appear here...'
  });

  // 2. RETRIEVE CACHED HISTORY ON MOUNT
  useEffect(() => {
    const savedHistory = localStorage.getItem('reviewcraft_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 3. SEAMLESS REASONING PIPELINE
  const handleTransform = async (e) => {
    e.preventDefault();
    if (!workLog.trim()) return alert("Please enter some work logs first!");

    setIsLoading(true);

    const GEMINI_KEY = process.env.REACT_APP_GEMINI_KEY;
    
    // ✅ FIX: Target the active production-grade frontier model
    const MODEL_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_KEY}`;

    const systemPrompt = `You are an expert executive resume writer and career coach.
Take the user's raw work logs and transform them into three distinct professional formats.
You MUST return your response as a valid, parsable JSON object with EXACTLY three keys: "resume", "appraisal", and "linkedin".`;

    try {
      const response = await fetch(MODEL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `Raw Work Logs:\n"${workLog}"` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await response.json();
      console.log("GOOGLE API LIVE RESPONSE:", data);

      // Explicit Server Error Handling
      if (data && data.error) {
        console.error("Google Server Error:", data.error.message);
        alert(`Google Server Error: ${data.error.message}`);
        throw new Error(data.error.message);
      }

      let rawText = "";
      if (
        data &&
        data.candidates &&
        data.candidates &&
        data.candidates.content &&
        data.candidates.content.parts &&
        data.candidates.content.parts
      ) {
        rawText = data.candidates.content.parts.text;
      }

      if (!rawText) throw new Error("No text returned from model runtime.");

      const aiOutputs = JSON.parse(rawText.trim());

      setOutputs({
        resume: aiOutputs.resume,
        appraisal: aiOutputs.appraisal,
        linkedin: aiOutputs.linkedin
      });

      const newItem = { id: Date.now(), log: workLog, date: new Date().toLocaleDateString() };
      setHistory((prevHistory) => {
        const updatedHistory = [newItem, ...prevHistory];
        localStorage.setItem('reviewcraft_history', JSON.stringify(updatedHistory));
        return updatedHistory;
      });

    } catch (error) {
      console.error("Gemini Generation Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
      {/* Top Banner Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🚀</span>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            ReviewCraft AI
          </h1>
        </div>
        <span className="text-xs bg-cyan-500/10 text-cyan-400 font-mono px-2.5 py-1 rounded-full border border-cyan-500/20">
          MVP v1.0
        </span>
      </header>

      {/* Primary Layout Engine */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Interface Panels */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl">
            <h2 className="text-lg font-semibold mb-2 text-slate-200">Raw Work Log</h2>
            <p className="text-xs text-slate-400 mb-4">Paste your messy metrics, standups, or Jira references below.</p>

            <form onSubmit={handleTransform}>
              <textarea
                value={workLog}
                onChange={(e) => setWorkLog(e.target.value)}
                placeholder="e.g. Fixed auth error, optimized DB query..."
                className="w-full h-64 bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500 transition font-mono text-slate-300 "
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold py-2.5 px-4 rounded-lg transition text-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <span>Processing Magic... ✨</span> : <span>Craft Narrative ⚡</span>}
              </button>
            </form>
          </div>

          {/* Local Caching Feed */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Saved Snippets</h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-600 italic">No logs cached yet.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {history.map(item => (
                  <div key={item.id} onClick={() => setWorkLog(item.log)} className="p-2 bg-slate-900 rounded border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <p className="text-xs text-slate-300 truncate font-mono">{item.log}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Dynamic Multi-Tab Performance Output Views */}
        <section className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-800 shadow-xl flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-800 bg-slate-950/80">
            {['resume', 'appraisal', 'linkedin'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition cursor-pointer ${activeTab === tab ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                {tab === 'resume' && '📄 Resume Bullets'}
                {tab === 'appraisal' && '📝 Self-Appraisal'}
                {tab === 'linkedin' && '💼 LinkedIn Update'}
              </button>
            ))}
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between">
            <div className="whitespace-pre-line font-mono text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-900 h-96 overflow-y-auto">
              {outputs[activeTab]}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-900 flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(outputs[activeTab]);
                  alert("Copied to clipboard!");
                }}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-xs transition font-medium cursor-pointer"
              >
                📋 Copy Active View
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;