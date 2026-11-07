/** Storage is optional, not a prerequisite for truthfully acknowledging a
 * submission. Retain the current page's accepted receipt in memory first. */
export type ReceiptStorage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function createReceiptStore<T>(
  key: string,
  storage: () => ReceiptStorage,
  validate: (value: unknown) => T | null,
) {
  let accepted: T | null = null
  return {
    read(): T | null {
      // Prefer the latest accepted receipt even if a failed setItem left an
      // older receipt in storage. Memory lasts only for this document/session.
      if (accepted !== null) return accepted
      try {
        const raw = storage().getItem(key)
        return raw ? validate(JSON.parse(raw)) : null
      } catch {
        return null
      }
    },
    write(value: T) {
      accepted = value
      try { storage().setItem(key, JSON.stringify(value)) } catch {
        // Blocked/quota-limited storage must not turn acceptance into failure.
      }
    },
  }
}
