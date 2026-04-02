import { useState } from "react";
import { aiChatService } from "../services/aiChatService";

const newMessage = (role, content, kind = "text", payload = null) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  kind,
  payload,
  createdAt: new Date().toISOString(),
});

const createDbSummary = (response) => {
  const collection =
    response?.data?.collection || response?.query?.collection || "records";
  const action = response?.data?.action || response?.query?.action || "find";
  const count = Number.isFinite(response?.data?.count)
    ? response.data.count
    : Array.isArray(response?.data?.results)
      ? response.data.results.length
      : 0;

  const totalMatched = Number.isFinite(response?.data?.pagination?.totalMatched)
    ? response.data.pagination.totalMatched
    : count;
  const page = Number.isFinite(response?.data?.pagination?.page)
    ? response.data.pagination.page
    : 1;
  const totalPages = Number.isFinite(response?.data?.pagination?.totalPages)
    ? response.data.pagination.totalPages
    : 1;

  return `Showing ${count} of ${totalMatched} ${collection} record${totalMatched === 1 ? "" : "s"} (${action}) - page ${page}/${totalPages}.`;
};

const INITIAL_MESSAGES = [
  newMessage(
    "assistant",
    "Hi there. I am your local AI assistant powered by Ollama. How can I help you today?",
  ),
];

export const useAiChat = () => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [dbPagingState, setDbPagingState] = useState({});
  const [error, setError] = useState("");

  const sendPrompt = async (prompt) => {
    if (isLoading) return;

    const normalizedPrompt = typeof prompt === "string" ? prompt.trim() : "";
    if (!normalizedPrompt) {
      setError("Please enter a prompt.");
      return;
    }

    setError("");
    setMessages((prev) => [...prev, newMessage("user", normalizedPrompt)]);
    setIsLoading(true);

    try {
      const response = await aiChatService.ask(normalizedPrompt);

      if (response?.mode === "db" && response?.data) {
        setMessages((prev) => [
          ...prev,
          newMessage("assistant", createDbSummary(response), "db", response),
        ]);
      } else {
        const reply = response?.reply || "I could not generate a response.";
        setMessages((prev) => [...prev, newMessage("assistant", reply)]);
      }
    } catch (requestError) {
      const message =
        requestError?.message || "Unable to get AI response right now.";
      setError(message);
      setMessages((prev) => [
        ...prev,
        newMessage(
          "assistant",
          "I could not complete that request. Please try again.",
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages(INITIAL_MESSAGES);
    setDbPagingState({});
    setError("");
  };

  const loadDbPage = async (messageId, nextPage, pageSize) => {
    const targetMessage = messages.find((message) => message.id === messageId);
    const baseQuery = targetMessage?.payload?.query;

    if (!baseQuery) return;

    setDbPagingState((prev) => ({ ...prev, [messageId]: true }));
    setError("");

    try {
      const query = {
        ...baseQuery,
        mode: "db",
        page: nextPage,
      };

      if (Number.isFinite(pageSize) && pageSize > 0) {
        query.limit = pageSize;
      }

      const response = await aiChatService.runDbQuery(query);

      setMessages((prev) =>
        prev.map((message) => {
          if (message.id !== messageId) return message;

          return {
            ...message,
            content: createDbSummary(response),
            payload: response,
          };
        }),
      );
    } catch (requestError) {
      const message =
        requestError?.message || "Unable to load more data right now.";
      setError(message);
    } finally {
      setDbPagingState((prev) => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
    }
  };

  return {
    messages,
    isLoading,
    error,
    dbPagingState,
    sendPrompt,
    loadDbPage,
    clearChat,
  };
};
