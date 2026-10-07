export async function withTimeout<T>(promise: PromiseLike<T>, ms = 4000, message = 'Request timed out'): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
