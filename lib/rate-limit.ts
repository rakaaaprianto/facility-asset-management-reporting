import "server-only";

type RateLimitRecord = {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
};

const store = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Periodic cleanup of expired entries (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.lockedUntil && record.lockedUntil < now) {
      store.delete(key);
    } else if (now - record.firstAttemptAt > WINDOW_MS && !record.lockedUntil) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

export type RateLimitResult = {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
};

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const record = store.get(key);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  // If window expired and not locked, reset
  if (now - record.firstAttemptAt > WINDOW_MS) {
    store.delete(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    const retryAfterSeconds = Math.ceil(LOCKOUT_MS / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - record.count),
  };
}

export function recordFailedAttempt(key: string): RateLimitResult {
  const now = Date.now();
  let record = store.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    record = { count: 1, firstAttemptAt: now };
    store.set(key, record);
  } else {
    record.count += 1;
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000),
    };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - record.count),
  };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}
