import { Bot, Sparkles, User2 } from "lucide-react";
import AiDbResultCard from "./AiDbResultCard";

const STARTER_PROMPTS = [
  "Show pending customer balances for this month.",
  "Give me today\'s job completion summary by staff.",
  "Compare site-wise revenue for the last 30 days.",
  "List high-value customers with total paid amount.",
];

const formatMessageTime = (value) => {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AiChatMessages = ({
  messages,
  isLoading,
  dbPagingState,
  onLoadDbPage,
  listRef,
  onUsePrompt,
}) => {
  const hasOnlyWelcomeMessage = messages.length <= 1;

  return (
    <div
      ref={listRef}
      className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-slate-50 to-white px-4 py-4 md:px-6"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-4">
        {hasOnlyWelcomeMessage && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-1.5 text-blue-700">
                <Sparkles size={14} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                Try one of these smart prompts
              </h3>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onUsePrompt?.(prompt)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </section>
        )}

        {messages.map((message) => {
          const isUser = message.role === "user";
          const isDbMessage =
            !isUser && message.kind === "db" && message.payload;
          const messageTime = formatMessageTime(message.createdAt);

          return (
            <div
              key={message.id}
              className={`flex items-end gap-3 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm sm:inline-flex">
                  <Bot size={15} />
                </div>
              )}

              {isDbMessage ? (
                <div className="w-full max-w-[98%] md:max-w-[90%]">
                  <div className="mb-1 flex items-center gap-2 text-[11px] font-medium text-slate-500">
                    <span>AI Assistant</span>
                    {messageTime && <span>{messageTime}</span>}
                  </div>
                  <AiDbResultCard
                    messageId={message.id}
                    payload={message.payload}
                    isPageLoading={Boolean(dbPagingState?.[message.id])}
                    onLoadDbPage={onLoadDbPage}
                  />
                </div>
              ) : (
                <div
                  className={`max-w-[92%] md:max-w-[74%] ${isUser ? "order-1" : "order-2"}`}
                >
                  <div
                    className={`mb-1 flex items-center gap-2 text-[11px] font-medium ${
                      isUser ? "justify-end text-slate-500" : "text-slate-500"
                    }`}
                  >
                    <span>{isUser ? "You" : "AI Assistant"}</span>
                    {messageTime && <span>{messageTime}</span>}
                  </div>

                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                        : "border border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              )}

              {isUser && (
                <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 shadow-sm sm:inline-flex">
                  <User2 size={15} />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-end gap-3">
            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm sm:inline-flex">
              <Bot size={15} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-slate-500"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-slate-500"
                  style={{ animationDelay: "0.3s" }}
                />
                <span className="ml-1 text-xs text-slate-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiChatMessages;
