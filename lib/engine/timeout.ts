export class ProcessingTimeoutError extends Error {
  constructor(message = "Processing timed out") {
    super(message);
    this.name = "ProcessingTimeoutError";
  }
}

/**
 * Race a promise against a hard deadline. The deadline is a last resort:
 * cooperative cancellation (AbortSignal) is preferred so in-flight work
 * actually stops instead of burning CPU after the response is sent.
 *
 * The losing promise's settlement is swallowed so a late rejection never
 * surfaces as an unhandled rejection.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ProcessingTimeoutError()), ms);
  });
  const result = Promise.race([promise, deadline]).finally(() =>
    clearTimeout(timer)
  );
  promise.catch(() => {});
  return result;
}
