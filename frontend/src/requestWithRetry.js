import axios from "axios";

const wait = (milliseconds, signal) => new Promise((resolve, reject) => {
  const timer = window.setTimeout(resolve, milliseconds);
  signal?.addEventListener("abort", () => {
    window.clearTimeout(timer);
    reject(new DOMException("Request cancelled", "AbortError"));
  }, { once: true });
});

export async function getWithRetry(url, config = {}, attempts = 3) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await axios.get(url, { timeout: 20000, ...config });
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const canRetry = !status || status === 408 || status === 429 || status >= 500;

      if (!canRetry || attempt === attempts - 1 || config.signal?.aborted) {
        throw error;
      }

      await wait(800 * (2 ** attempt), config.signal);
    }
  }

  throw lastError;
}
