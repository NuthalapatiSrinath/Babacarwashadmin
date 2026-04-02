import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Bot,
  Clock3,
  Database,
  Download,
  Expand,
  Minimize,
  Sparkles,
  Trash2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AiChatComposer from "../components/AiChatComposer";
import AiChatMessages from "../components/AiChatMessages";
import { useAiChat } from "../hooks/useAiChat";

const QUICK_PROMPTS = [
  {
    label: "Revenue snapshot",
    prompt: "Show revenue summary for the current month by service type.",
  },
  {
    label: "Pending payments",
    prompt: "List customers with pending payments and grouped totals.",
  },
  {
    label: "Today's jobs",
    prompt: "Show today's jobs with assigned staff and status.",
  },
  {
    label: "Top customers",
    prompt: "Show top 10 customers by total amount paid.",
  },
  {
    label: "Site performance",
    prompt: "Compare site-wise booking counts for the last 30 days.",
  },
  {
    label: "Staff workload",
    prompt: "Show staff workload distribution for this week.",
  },
];

const truncate = (value, max = 400) => {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const toCsvCell = (value) => {
  const text = String(value ?? "");
  const escaped = text.replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
};

const formatTime = (value) => {
  if (!value) return "--";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AiAssistantPage = () => {
  const {
    messages,
    isLoading,
    error,
    dbPagingState,
    sendPrompt,
    loadDbPage,
    clearChat,
  } = useAiChat();
  const [prompt, setPrompt] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const listRef = useRef(null);
  const wrapperRef = useRef(null);
  const exportMenuRef = useRef(null);

  const userMessageCount = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages],
  );

  const assistantMessageCount = useMemo(
    () => messages.filter((message) => message.role === "assistant").length,
    [messages],
  );

  const dbMessageCount = useMemo(
    () =>
      messages.filter(
        (message) => message.role === "assistant" && message.kind === "db",
      ).length,
    [messages],
  );

  const lastAssistantTime = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const candidate = messages[i];
      if (candidate.role === "assistant") {
        return formatTime(candidate.createdAt);
      }
    }

    return "Waiting";
  }, [messages]);

  const runPrompt = async (value) => {
    if (isLoading) return;

    const normalized = String(value ?? "").trim();
    if (!normalized) return;

    setPrompt("");
    await sendPrompt(normalized);
  };

  const submitPrompt = async () => {
    await runPrompt(prompt);
  };

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!isExportMenuOpen) return;
      if (!exportMenuRef.current) return;
      if (exportMenuRef.current.contains(event.target)) return;

      setIsExportMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isExportMenuOpen]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && wrapperRef.current) {
        await wrapperRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (_) {
      // Keep UI stable even if fullscreen API is blocked by browser policy.
    }
  };

  const buildExportPayload = () => ({
    exportedAt: new Date().toISOString(),
    source: "BCW AI Assistant",
    totalMessages: messages.length,
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role,
      kind: message.kind || "text",
      content: message.content,
      createdAt: message.createdAt,
      payload: message.payload || null,
    })),
  });

  const downloadBlob = (content, type, extension) => {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ai-chat-export-${Date.now()}.${extension}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportJson = () => {
    const payload = buildExportPayload();
    downloadBlob(JSON.stringify(payload, null, 2), "application/json", "json");
    setIsExportMenuOpen(false);
  };

  const handleExportCsv = () => {
    const rows = [
      ["index", "role", "kind", "createdAt", "content", "payload"],
      ...messages.map((message, index) => [
        String(index + 1),
        message.role || "",
        message.kind || "text",
        message.createdAt || "",
        message.content || "",
        message.payload ? JSON.stringify(message.payload) : "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => toCsvCell(value)).join(","))
      .join("\n");

    downloadBlob(csv, "text/csv;charset=utf-8", "csv");
    setIsExportMenuOpen(false);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    doc.setFontSize(14);
    doc.text("AI Chat Export", 30, 32);
    doc.setFontSize(10);
    doc.text(
      `Exported: ${new Date().toLocaleString()} | Messages: ${messages.length}`,
      30,
      50,
    );

    autoTable(doc, {
      startY: 64,
      head: [["#", "Role", "Type", "Time", "Content", "Payload"]],
      body: messages.map((message, index) => [
        String(index + 1),
        message.role || "",
        message.kind || "text",
        message.createdAt ? new Date(message.createdAt).toLocaleString() : "",
        truncate(message.content, 250),
        truncate(message.payload ? JSON.stringify(message.payload) : "", 250),
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 4,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
      },
      margin: { left: 20, right: 20 },
    });

    doc.save(`ai-chat-export-${Date.now()}.pdf`);
    setIsExportMenuOpen(false);
  };

  const handleClearChat = () => {
    clearChat();
    setPrompt("");
  };

  return (
    <div className={isFullscreen ? "p-0" : "p-3 md:p-5"}>
      <div
        ref={wrapperRef}
        className={`relative flex min-h-0 flex-col overflow-hidden border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(2,6,23,0.08)] ${
          isFullscreen
            ? "fixed inset-0 z-[1200] h-screen w-screen rounded-none border-0"
            : "mx-auto h-[calc(100vh-180px)] min-h-[640px] w-full max-w-[1540px] rounded-[28px]"
        }`}
      >
        <div className="relative shrink-0 overflow-hidden border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-4 py-4 text-white md:px-6 md:py-5">
          <div className="pointer-events-none absolute -left-8 -top-16 h-44 w-44 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-52 rounded-bl-[90px] bg-blue-500/15 blur-2xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/20 bg-white/10 p-2.5 backdrop-blur">
                <Bot size={20} />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight md:text-xl">
                  AI Command Center
                </p>
                <p className="mt-0.5 text-xs text-slate-200">
                  Local Ollama intelligence with live database insights
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
                <BadgeCheck size={14} />
                Model Online
              </div>

              <div className="relative" ref={exportMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/15"
                >
                  <Download size={14} />
                  Export Chat
                </button>

                {isExportMenuOpen && (
                  <div className="absolute right-0 top-full z-20 mt-2 min-w-[180px] rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Export as JSON
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Export as PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Export as CSV
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/15"
              >
                {isFullscreen ? <Minimize size={14} /> : <Expand size={14} />}
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </button>

              <button
                type="button"
                onClick={handleClearChat}
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/15"
              >
                <Trash2 size={14} />
                Clear Chat
              </button>
            </div>
          </div>

          <div className="relative mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-wide text-slate-300">
                Conversation
              </p>
              <p className="mt-1 text-base font-semibold">{messages.length}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-wide text-slate-300">
                User Requests
              </p>
              <p className="mt-1 text-base font-semibold">{userMessageCount}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-wide text-slate-300">
                DB Insights
              </p>
              <p className="mt-1 text-base font-semibold">{dbMessageCount}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-wide text-slate-300">
                Last Reply
              </p>
              <p className="mt-1 text-base font-semibold">
                {lastAssistantTime}
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-50 to-white lg:flex-row">
          <section className="flex min-h-0 flex-1 flex-col">
            {error && (
              <div className="shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 md:px-6">
                {error}
              </div>
            )}

            <div className="shrink-0 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-blue-600" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Quick Prompts
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => runPrompt(item.prompt)}
                    disabled={isLoading}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <AiChatMessages
              messages={messages}
              isLoading={isLoading}
              dbPagingState={dbPagingState}
              onLoadDbPage={loadDbPage}
              listRef={listRef}
              onUsePrompt={runPrompt}
            />

            <AiChatComposer
              value={prompt}
              onChange={setPrompt}
              onSubmit={submitPrompt}
              onClearPrompt={() => setPrompt("")}
              isLoading={isLoading}
            />
          </section>

          <aside className="hidden w-[320px] shrink-0 border-l border-slate-200 bg-white/90 p-4 lg:flex lg:flex-col lg:gap-4">
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-blue-900 p-4 text-white">
              <p className="text-xs uppercase tracking-[0.14em] text-blue-200">
                Assistant Status
              </p>
              <p className="mt-2 text-lg font-semibold leading-tight">
                Ready for analytics, summaries, and operational queries.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-white/10 px-2 py-2">
                  <p className="text-blue-200">Replies</p>
                  <p className="mt-1 text-sm font-semibold">
                    {assistantMessageCount}
                  </p>
                </div>
                <div className="rounded-lg bg-white/10 px-2 py-2">
                  <p className="text-blue-200">DB Cards</p>
                  <p className="mt-1 text-sm font-semibold">{dbMessageCount}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Live Session
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <Activity size={14} /> Activity
                  </span>
                  <span className="font-semibold">
                    {messages.length} messages
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <Database size={14} /> Data Queries
                  </span>
                  <span className="font-semibold">{dbMessageCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <Clock3 size={14} /> Last Reply
                  </span>
                  <span className="font-semibold">{lastAssistantTime}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Suggested Tasks
              </p>
              <div className="mt-3 space-y-2">
                {[
                  "Show pending invoices from the last 14 days",
                  "Find inactive customers in the last 60 days",
                  "Compare weekend bookings by location",
                ].map((task) => (
                  <button
                    key={task}
                    type="button"
                    onClick={() => runPrompt(task)}
                    disabled={isLoading}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {task}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPage;
