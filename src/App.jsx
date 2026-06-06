import { useState, useCallback } from "react";

const DEFAULT_TOPICS = [
  {
    id: "col-politica",
    label: "Colombia · Política & Gobierno",
    icon: "🇨🇴",
    prompt:
      "Busca y resume las noticias más importantes de HOY sobre política y gobierno en Colombia, incluyendo el gobierno Petro, reformas legislativas, Decreto 0415 fondos pensionales / Colpensiones, y negociaciones de paz. Usa solo fuentes reconocidas (El Tiempo, Semana, El Espectador, Bloomberg, Reuters, AP). Responde en español.",
  },
  {
    id: "col-economia",
    label: "Colombia · Economía & Mercados",
    icon: "📊",
    prompt:
      "Busca y resume las noticias más importantes de HOY sobre la economía colombiana: TRM peso/dólar, bolsa de valores, inflación, política monetaria del Banco de la República, calificaciones de riesgo, y perspectivas de JPMorgan, BTG Pactual, Goldman Sachs u otras casas de análisis sobre Colombia. Usa solo fuentes reconocidas. Responde en español.",
  },
  {
    id: "latam",
    label: "Latinoamérica · Regional",
    icon: "🌎",
    prompt:
      "Busca y resume las noticias más relevantes de HOY en América Latina: política, economía, elecciones y tensiones regionales en Venezuela, Argentina, México, Brasil y otros países relevantes. Usa solo fuentes reconocidas (Reuters, AP, Bloomberg, El País, BBC Mundo). Responde en español.",
  },
  {
    id: "mundo",
    label: "Mundo · Geopolítica & Economía",
    icon: "🌐",
    prompt:
      "Busca y resume las noticias geopolíticas y económicas más importantes del mundo HOY: conflictos activos, decisiones de la Fed/BCE, mercados globales, relaciones internacionales y grandes tendencias. Usa solo fuentes reconocidas (Reuters, AP, Bloomberg, FT, NYT, WSJ). Responde en español.",
  },
];

function Spinner() {
  return (
    <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function BulletContent({ text }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div className="bullet-content">
      {lines.map((line, i) => {
        const isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line);
        const isHeader = line.startsWith("##") || (line.startsWith("**") && line.endsWith("**"));
        let clean = line.replace(/^#{1,3}\s*/, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/^[-•*]\s*/, "").replace(/^\d+\.\s*/, "");
        if (isHeader) return <p key={i} className="section-header" dangerouslySetInnerHTML={{ __html: clean }} />;
        if (isBullet) return (
          <div key={i} className="bullet-item">
            <span className="bullet-dot">▸</span>
            <span dangerouslySetInnerHTML={{ __html: clean }} />
          </div>
        );
        return <p key={i} dangerouslySetInnerHTML={{ __html: clean }} />;
      })}
    </div>
  );
}

function TopicCard({ topic }) {
  const [state, setState] = useState("idle");
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [ts, setTs] = useState(null);

  const handleFetch = useCallback(async () => {
    setState("loading");
    setExpanded(false);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: topic.prompt }],
        }),
      });
      const data = await res.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      setContent(text || "Sin resultado.");
      setState("done");
      setExpanded(true);
      setTs(new Date());
    } catch {
      setContent("Error al consultar la API.");
      setState("error");
    }
  }, [topic]);

  return (
    <div className={`card ${state}`}>
      <div className="card-header" onClick={state === "done" ? () => setExpanded((e) => !e) : undefined}>
        <div className="card-meta">
          <span className="topic-icon">{topic.icon}</span>
          <span className="topic-label">{topic.label}</span>
          {ts && <span className="ts">{ts.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
        <div className="card-actions">
          {state === "done" && <button className="btn-icon">{expanded ? "▲" : "▼"}</button>}
          <button className={`btn-fetch ${state}`} onClick={(e) => { e.stopPropagation(); handleFetch(); }} disabled={state === "loading"}>
            {state === "loading" ? <Spinner /> : state === "done" ? "↻ Actualizar" : "Obtener"}
          </button>
        </div>
      </div>
      {state === "loading" && <div className="loading-bar"><div className="loading-progress" /></div>}
      {state === "done" && expanded && <div className="card-body"><BulletContent text={content} /></div>}
      {state === "error" && <div className="card-body error-msg">{content}</div>}
    </div>
  );
}

export default function App() {
  const [topics] = useState(DEFAULT_TOPICS);
  const [fetchAll, setFetchAll] = useState(0);
  const now = new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;1,8..60,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --ink: #1a1208; --paper: #f5f0e8; --cream: #ede7d5; --accent: #8b2500; --gold: #b8860b; --muted: #6b5e4a; --border: #c8b89a; --card-bg: #faf7f2; }
        body { background: var(--paper); font-family: 'Source Serif 4', Georgia, serif; color: var(--ink); min-height: 100vh; }
        .masthead { border-bottom: 3px double var(--border); padding: 28px 40px 20px; background: var(--paper); }
        .masthead::before { content: ''; display: block; height: 3px; background: var(--ink); margin-bottom: 18px; }
        .masthead-top { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
        .paper-name { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 900; letter-spacing: -0.02em; line-height: 1; }
        .paper-name span { color: var(--accent); }
        .masthead-right { text-align: right; font-size: 0.78rem; color: var(--muted); font-style: italic; line-height: 1.6; }
        .tagline { font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin-top: 8px; border-top: 1px solid var(--border); padding-top: 8px; }
        .main { max-width: 860px; margin: 0 auto; padding: 32px 24px 64px; }
        .toolbar { display: flex; justify-content: flex-end; margin-bottom: 28px; }
        .btn-all { font-family: 'Source Serif 4', serif; font-size: 0.82rem; letter-spacing: 0.12em; text-transform: uppercase; background: var(--ink); color: var(--paper); border: none; padding: 10px 22px; cursor: pointer; transition: background 0.2s; }
        .btn-all:hover { background: var(--accent); }
        .cards { display: flex; flex-direction: column; gap: 16px; }
        .card { background: var(--card-bg); border: 1px solid var(--border); border-left: 4px solid var(--border); transition: border-left-color 0.3s; }
        .card.loading { border-left-color: var(--gold); }
        .card.done { border-left-color: var(--accent); }
        .card.error { border-left-color: #c0392b; }
        .card-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; cursor: default; gap: 12px; }
        .card.done .card-header { cursor: pointer; }
        .card.done .card-header:hover { background: var(--cream); }
        .card-meta { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        .topic-icon { font-size: 1.1rem; flex-shrink: 0; }
        .topic-label { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ts { font-size: 0.7rem; color: var(--muted); font-style: italic; flex-shrink: 0; }
        .card-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .btn-icon { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 0.7rem; padding: 4px; }
        .btn-fetch { font-family: 'Source Serif 4', serif; font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid var(--border); background: var(--paper); color: var(--ink); padding: 6px 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
        .btn-fetch:hover:not(:disabled) { background: var(--ink); color: var(--paper); }
        .btn-fetch:disabled { opacity: 0.6; cursor: default; }
        .btn-fetch.done { border-color: var(--accent); color: var(--accent); }
        .loading-bar { height: 2px; background: var(--cream); overflow: hidden; }
        .loading-progress { height: 100%; background: var(--gold); animation: progress 2.5s ease-in-out infinite; }
        @keyframes progress { 0% { width: 0%; margin-left: 0; } 50% { width: 60%; margin-left: 20%; } 100% { width: 0%; margin-left: 100%; } }
        .card-body { padding: 16px 20px 20px; border-top: 1px solid var(--border); animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        .bullet-content { display: flex; flex-direction: column; gap: 8px; }
        .bullet-item { display: flex; gap: 10px; align-items: flex-start; font-size: 0.9rem; line-height: 1.55; color: #2a1f10; }
        .bullet-dot { color: var(--accent); flex-shrink: 0; margin-top: 2px; font-size: 0.75rem; }
        .section-header { font-family: 'Playfair Display', serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin-top: 10px; margin-bottom: 2px; border-bottom: 1px solid var(--border); padding-bottom: 4px; }
        .bullet-content p { font-size: 0.9rem; line-height: 1.55; color: #2a1f10; }
        .error-msg { color: #c0392b; font-size: 0.85rem; font-style: italic; }
        .spin { animation: rotate 0.9s linear infinite; }
        @keyframes rotate { to { transform: rotate(360deg); } }
        .footer { text-align: center; font-size: 0.72rem; color: var(--muted); font-style: italic; border-top: 1px solid var(--border); padding-top: 24px; margin-top: 40px; }
        @media (max-width: 600px) { .masthead { padding: 20px 18px 16px; } .main { padding: 20px 14px 40px; } .topic-label { font-size: 0.88rem; } }
      `}</style>
      <header className="masthead">
        <div className="masthead-top">
          <div className="paper-name">Brief<span>ing</span></div>
          <div className="masthead-right">{now}<br />Powered by Claude + Web Search</div>
        </div>
        <div className="tagline">Inteligencia informativa personalizada · Colombia & el mundo</div>
      </header>
      <main className="main">
        <div className="toolbar">
          <button className="btn-all" onClick={() => setFetchAll((n) => n + 1)}>↻ Actualizar todo</button>
        </div>
        <div className="cards">
          {topics.map((topic) => (
            <TopicCard key={`${topic.id}-${fetchAll}`} topic={topic} />
          ))}
        </div>
        <div className="footer">Fuentes consultadas: El Tiempo, Semana, El Espectador, Bloomberg, Reuters, AP, FT, WSJ, BBC Mundo, El País</div>
      </main>
    </>
  );
}
