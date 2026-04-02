import {
  CornerDownLeft,
  RotateCcw,
  SendHorizontal,
  Sparkles,
} from "lucide-react";

const MAX_PROMPT_LENGTH = 3000;

const AiChatComposer = ({
  value,
  onChange,
  onSubmit,
  onClearPrompt,
  isLoading,
}) => {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const charCount = value.length;
  const isNearLimit = charCount > MAX_PROMPT_LENGTH * 0.85;

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <Sparkles size={14} className="text-blue-600" />
            Prompt Studio
          </label>
          <p
            className={`text-[11px] font-semibold ${
              isNearLimit ? "text-amber-600" : "text-slate-400"
            }`}
          >
            {charCount}/{MAX_PROMPT_LENGTH}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_PROMPT_LENGTH}
            placeholder="Ask in plain language. Example: show pending payments this month by site and service type."
            className="min-h-[120px] w-full resize-y border-0 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-0"
            disabled={isLoading}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/80 px-3 py-2">
            <p className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <CornerDownLeft size={12} /> Enter to send, Shift+Enter for new
              line
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClearPrompt || (() => onChange(""))}
                disabled={isLoading || !value.trim()}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={13} />
                Clear
              </button>

              <button
                type="button"
                onClick={onSubmit}
                disabled={isLoading || !value.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SendHorizontal size={13} />
                {isLoading ? "Generating..." : "Send Prompt"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChatComposer;
