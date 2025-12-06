// Simple in-memory rate limiter (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetIn: number
}

export function rateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1, resetIn: windowMs }
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, resetIn: record.resetTime - now }
  }

  record.count++
  return { success: true, remaining: limit - record.count, resetIn: record.resetTime - now }
}

// Helper to extract client IP from request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")

  if (forwarded) {
    const firstIP = forwarded.split(",")[0]
    return firstIP ? firstIP.trim() : "anonymous"
  }

  if (realIP) {
    return realIP
  }

  return "anonymous"
}
