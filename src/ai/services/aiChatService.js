const configuredApiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/$/,
  "",
);

const configuredHostBase = configuredApiBase.endsWith("/api")
  ? configuredApiBase.slice(0, -4)
  : configuredApiBase;

const uniqueUrls = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item || seen.has(item)) return false;
    seen.add(item);
    return true;
  });
};

const endpointCandidates = uniqueUrls([
  `${configuredApiBase}/chat`,
  `${configuredHostBase}/api/chat`,
  `${configuredHostBase}/chat`,
  "http://localhost:3002/api/chat",
  "http://localhost:3001/api/chat",
  "/api/chat",
  "/chat",
]);

const queryEndpointCandidates = uniqueUrls([
  `${configuredApiBase}/chat/query`,
  `${configuredHostBase}/api/chat/query`,
  `${configuredHostBase}/chat/query`,
  "http://localhost:3002/api/chat/query",
  "http://localhost:3001/api/chat/query",
  "/api/chat/query",
  "/chat/query",
]);

const buildErrorMessage = (statusCode, rawMessage) => {
  if (
    typeof rawMessage === "string" &&
    rawMessage.toLowerCase().includes("not installed")
  ) {
    return `${rawMessage}. Then restart backend.`;
  }

  if (statusCode === 404) {
    return "AI endpoint not found. Restart backend and verify /api/chat is available.";
  }

  if (statusCode === 502 || statusCode === 504) {
    return (
      rawMessage ||
      "Local Ollama is not reachable. Make sure Ollama is running."
    );
  }

  if (rawMessage) return rawMessage;

  return "Unable to get AI response right now.";
};

const requestChatReply = async (url, prompt) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || "";
    const requestError = new Error(buildErrorMessage(response.status, message));
    requestError.statusCode = response.status;
    requestError.endpoint = url;
    throw requestError;
  }

  const mode = String(payload?.mode || "general").toLowerCase();
  const reply = typeof payload?.reply === "string" ? payload.reply.trim() : "";

  if (mode === "db" && payload?.data && typeof payload.data === "object") {
    return {
      mode: "db",
      reply,
      query: payload.query || null,
      data: payload.data,
    };
  }

  if (reply) {
    return {
      mode: "general",
      reply,
      query: null,
      data: null,
    };
  }

  throw new Error("AI returned an empty response.");
};

const requestDbQueryResult = async (url, query) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || "";
    const requestError = new Error(buildErrorMessage(response.status, message));
    requestError.statusCode = response.status;
    requestError.endpoint = url;
    throw requestError;
  }

  if (String(payload?.mode || "").toLowerCase() === "db" && payload?.data) {
    return {
      mode: "db",
      reply: typeof payload?.reply === "string" ? payload.reply.trim() : "",
      query: payload.query || null,
      data: payload.data,
    };
  }

  throw new Error("Invalid DB query response.");
};

const isRouteFallbackError = (error) => {
  if (!error) return false;

  const statusCode = error.statusCode;
  if (statusCode === 404) return true;

  const message = (error.message || "").toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed")
  );
};

export const aiChatService = {
  ask: async (prompt) => {
    const normalizedPrompt = typeof prompt === "string" ? prompt.trim() : "";
    if (!normalizedPrompt) {
      throw new Error("Prompt is required.");
    }

    let lastError = null;

    for (const endpoint of endpointCandidates) {
      try {
        const output = await requestChatReply(endpoint, normalizedPrompt);
        return output;
      } catch (error) {
        lastError = error;

        if (!isRouteFallbackError(error)) {
          break;
        }
      }
    }

    throw new Error(
      lastError?.message ||
        "Unable to connect to AI backend. Please check backend and Ollama.",
    );
  },

  runDbQuery: async (query) => {
    if (!query || typeof query !== "object") {
      throw new Error("query is required");
    }

    let lastError = null;
    for (const endpoint of queryEndpointCandidates) {
      try {
        return await requestDbQueryResult(endpoint, query);
      } catch (error) {
        lastError = error;
        if (!isRouteFallbackError(error)) {
          break;
        }
      }
    }

    throw new Error(
      lastError?.message ||
        "Unable to execute database query. Please check backend connection.",
    );
  },
};
