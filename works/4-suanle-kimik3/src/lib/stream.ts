/* OpenAI 兼容 SSE 流解析 */

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onUsage?: (total: number) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

export async function consumeSSE(
  res: Response,
  cb: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  if (!res.body) {
    cb.onError(new Error("empty body"));
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const abort = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal?.addEventListener("abort", abort, { once: true });

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const ev of events) {
        const lines = ev.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          if (payload === "[DONE]") {
            cb.onDone();
            return;
          }
          try {
            const json = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
              usage?: { total_tokens?: number };
            };
            const delta = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content;
            if (delta) cb.onDelta(delta);
            if (json.usage?.total_tokens && cb.onUsage) cb.onUsage(json.usage.total_tokens);
          } catch {
            /* partial json chunk — ignore */
          }
        }
      }
    }
    cb.onDone();
  } catch (e) {
    if (signal?.aborted) {
      cb.onDone();
      return;
    }
    cb.onError(e instanceof Error ? e : new Error("stream error"));
  } finally {
    signal?.removeEventListener("abort", abort);
  }
}
