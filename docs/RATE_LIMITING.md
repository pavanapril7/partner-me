# Rate Limiting Configuration

## Overview

The anonymous submission system implements IP-based rate limiting to prevent spam and abuse. Rate limits are enforced at the API level before any database operations occur.

## Rate Limit Rules

### Submission Limits

**Per IP Address**:
- **24-hour window**: Maximum 3 submissions
- **1-hour window**: Maximum 2 submissions

These limits apply to the `/api/submissions/anonymous` endpoint only.

### Why These Limits?

- **24-hour limit (3)**: Prevents mass spam while allowing legitimate users to submit multiple ideas
- **1-hour limit (2)**: Prevents rapid-fire spam attacks while allowing quick corrections
- **IP-based**: Simple to implement, works for anonymous users without accounts

## Implementation

### Architecture

```
Request → Extract IP → Check Rate Limit → Allow/Deny → Process Submission
```

### IP Address Extraction

IP addresses are extracted from request headers in the following order:

1. **X-Forwarded-For**: Used when behind a proxy/load balancer (takes first IP)
2. **X-Real-IP**: Alternative proxy header
3. **Socket Remote Address**: Direct connection IP

**IPv6 Support**: Both IPv4 and IPv6 addresses are supported.

### Storage

Rate limit data is stored **in-memory** for performance:

```typescript
interface SubmissionAttempt {
  timestamp: number;  // Unix timestamp in milliseconds
  ip: string;         // IP address
}

// In-memory array of attempts
const submissionAttempts: SubmissionAttempt[] = [];
```

**Advantages**:
- Fast lookups (O(n) where n = attempts in window)
- No database overhead
- Automatic cleanup on restart

**Disadvantages**:
- Lost on server restart (acceptable for rate limiting)
- Not shared across multiple servers (see scaling section)

### Rate Limit Check Algorithm

```typescript
function checkSubmissionRateLimit(ip: string): {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
} {
  const now = Date.now();
  
  // Clean up old attempts (older than 24 hours)
  cleanupOldAttempts(now);
  
  // Get attempts from this IP
  const ipAttempts = submissionAttempts.filter(a => a.ip === ip);
  
  // Check 1-hour limit (2 submissions)
  const hourAgo = now - WINDOW_HOUR_MS;
  const recentAttempts = ipAttempts.filter(a => a.timestamp > hourAgo);
  if (recentAttempts.length >= MAX_PER_IP_PER_HOUR) {
    const oldestRecent = Math.min(...recentAttempts.map(a => a.timestamp));
    const retryAfter = Math.ceil((oldestRecent + WINDOW_HOUR_MS - now) / 1000);
    return {
      allowed: false,
      reason: 'Too many submissions in the last hour',
      retryAfter
    };
  }
  
  // Check 24-hour limit (3 submissions)
  const dayAgo = now - WINDOW_DAY_MS;
  const dailyAttempts = ipAttempts.filter(a => a.timestamp > dayAgo);
  if (dailyAttempts.length >= MAX_PER_IP_PER_DAY) {
    const oldestDaily = Math.min(...dailyAttempts.map(a => a.timestamp));
    const retryAfter = Math.ceil((oldestDaily + WINDOW_DAY_MS - now) / 1000);
    return {
      allowed: false,
      reason: 'Too many submissions in the last 24 hours',
      retryAfter
    };
  }
  
  return { allowed: true };
}
```

### Recording Attempts

```typescript
function recordSubmissionAttempt(ip: string): void {
  submissionAttempts.push({
    timestamp: Date.now(),
    ip
  });
}
```

**When to Record**:
- Record **after** successful submission creation
- Do **not** record failed validation attempts
- Do **not** record rate-limited attempts

### Cleanup

Old attempts are automatically cleaned up:

```typescript
function cleanupOldAttempts(now: number): void {
  const cutoff = now - WINDOW_DAY_MS;
  submissionAttempts = submissionAttempts.filter(
    a => a.timestamp > cutoff
  );
}
```

**When Cleanup Runs**:
- On every rate limit check
- Removes attempts older than 24 hours
- Keeps memory usage bounded

## Configuration

### Adjusting Limits

Edit `src/lib/submission-rate-limit.ts`:

```typescript
const SUBMISSION_RATE_LIMIT = {
  MAX_PER_IP_PER_DAY: 3,      // Change this for 24-hour limit
  MAX_PER_IP_PER_HOUR: 2,     // Change this for 1-hour limit
  WINDOW_DAY_MS: 24 * 60 * 60 * 1000,
  WINDOW_HOUR_MS: 60 * 60 * 1000,
};
```

**After changing**:
- Restart the server
- Test with multiple submissions
- Monitor for abuse patterns

### Recommended Limits

**Conservative** (low spam tolerance):
- 24-hour: 2 submissions
- 1-hour: 1 submission

**Moderate** (current default):
- 24-hour: 3 submissions
- 1-hour: 2 submissions

**Permissive** (high legitimate use):
- 24-hour: 5 submissions
- 1-hour: 3 submissions

### Disabling Rate Limiting

**Not recommended**, but possible for testing:

```typescript
// In src/app/api/submissions/anonymous/route.ts
// Comment out rate limit check:
/*
const rateLimitCheck = checkSubmissionRateLimit(ip);
if (!rateLimitCheck.allowed) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: rateLimitCheck.reason,
        retryAfter: rateLimitCheck.retryAfter,
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(rateLimitCheck.retryAfter),
      },
    }
  );
}
*/
```

## Error Responses

### Rate Limit Exceeded

**HTTP Status**: 429 Too Many Requests

**Response Body**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You have exceeded the submission limit. Please try again later.",
    "retryAfter": 3600
  }
}
```

**Response Headers**:
```
Retry-After: 3600
```

**Fields**:
- `code`: Error code for programmatic handling
- `message`: Human-readable error message
- `retryAfter`: Seconds until rate limit resets

### Client Handling

**Display to User**:
```typescript
if (error.code === 'RATE_LIMIT_EXCEEDED') {
  const hours = Math.ceil(error.retryAfter / 3600);
  alert(`You've submitted too many ideas. Please try again in ${hours} hour(s).`);
}
```

**Retry Logic**:
```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  setTimeout(() => {
    // Retry submission
  }, parseInt(retryAfter) * 1000);
}
```

## Monitoring

### Tracking Rate Limits

**Log Rate Limit Hits**:
```typescript
// In checkSubmissionRateLimit
if (!allowed) {
  console.log(`Rate limit exceeded for IP: ${ip}, reason: ${reason}`);
}
```

**Metrics to Track**:
- Number of rate limit hits per hour
- IPs hitting rate limits frequently
- Time of day patterns
- Correlation with spam submissions

### Identifying Abuse

**Warning Signs**:
- Same IP hitting limit repeatedly
- Multiple IPs from same subnet
- Coordinated submission patterns
- Rate limits hit immediately after reset

**Response Actions**:
- Review submissions from flagged IPs
- Consider IP blocking for persistent abuse
- Adjust rate limits if needed
- Implement CAPTCHA for high-risk IPs

## Scaling Considerations

### Single Server

Current implementation works well for single-server deployments:
- In-memory storage is fast
- No external dependencies
- Simple to maintain

### Multiple Servers

For multi-server deployments, consider using **Redis**:

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function checkSubmissionRateLimit(ip: string): Promise<{
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}> {
  const hourKey = `ratelimit:hour:${ip}`;
  const dayKey = `ratelimit:day:${ip}`;
  
  // Check 1-hour limit
  const hourCount = await redis.incr(hourKey);
  if (hourCount === 1) {
    await redis.expire(hourKey, 3600); // 1 hour TTL
  }
  if (hourCount > MAX_PER_IP_PER_HOUR) {
    const ttl = await redis.ttl(hourKey);
    return {
      allowed: false,
      reason: 'Too many submissions in the last hour',
      retryAfter: ttl
    };
  }
  
  // Check 24-hour limit
  const dayCount = await redis.incr(dayKey);
  if (dayCount === 1) {
    await redis.expire(dayKey, 86400); // 24 hours TTL
  }
  if (dayCount > MAX_PER_IP_PER_DAY) {
    const ttl = await redis.ttl(dayKey);
    return {
      allowed: false,
      reason: 'Too many submissions in the last 24 hours',
      retryAfter: ttl
    };
  }
  
  return { allowed: true };
}
```

**Benefits**:
- Shared across all servers
- Persistent across restarts
- Automatic expiration via TTL
- High performance

### Load Balancer Considerations

**IP Address Extraction**:
- Ensure load balancer passes `X-Forwarded-For` header
- Configure to pass real client IP, not load balancer IP
- Test IP extraction in production environment

**Sticky Sessions**:
- Not required for rate limiting
- Rate limits work across all servers with Redis

## Testing

### Manual Testing

**Test Rate Limits**:
```bash
# Submit 3 times rapidly (should succeed)
for i in {1..3}; do
  curl -X POST http://localhost:3000/api/submissions/anonymous \
    -H "Content-Type: application/json" \
    -d '{
      "title": "Test Submission '$i'",
      "description": "This is a test submission for rate limiting",
      "budgetMin": 1000,
      "budgetMax": 5000,
      "contactEmail": "test@example.com",
      "imageIds": ["img_test123"]
    }'
  echo ""
done

# 4th submission should fail with 429
curl -X POST http://localhost:3000/api/submissions/anonymous \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Submission 4",
    "description": "This should be rate limited",
    "budgetMin": 1000,
    "budgetMax": 5000,
    "contactEmail": "test@example.com",
    "imageIds": ["img_test123"]
  }'
```

### Automated Testing

**Unit Tests**:
```typescript
describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit data
    clearSubmissionAttempts();
  });
  
  test('allows submissions within limits', () => {
    const ip = '192.168.1.1';
    
    // First submission
    expect(checkSubmissionRateLimit(ip).allowed).toBe(true);
    recordSubmissionAttempt(ip);
    
    // Second submission
    expect(checkSubmissionRateLimit(ip).allowed).toBe(true);
    recordSubmissionAttempt(ip);
    
    // Third submission
    expect(checkSubmissionRateLimit(ip).allowed).toBe(true);
  });
  
  test('blocks submissions exceeding 24-hour limit', () => {
    const ip = '192.168.1.1';
    
    // Record 3 submissions
    for (let i = 0; i < 3; i++) {
      recordSubmissionAttempt(ip);
    }
    
    // 4th submission should be blocked
    const result = checkSubmissionRateLimit(ip);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('24 hours');
  });
  
  test('blocks submissions exceeding 1-hour limit', () => {
    const ip = '192.168.1.1';
    
    // Record 2 submissions in last hour
    recordSubmissionAttempt(ip);
    recordSubmissionAttempt(ip);
    
    // 3rd submission should be blocked
    const result = checkSubmissionRateLimit(ip);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('hour');
  });
});
```

### Integration Tests

**Test Full Flow**:
```typescript
describe('Submission Rate Limiting Integration', () => {
  test('enforces rate limits on submission endpoint', async () => {
    const submissionData = {
      title: 'Test Submission',
      description: 'This is a test submission',
      budgetMin: 1000,
      budgetMax: 5000,
      contactEmail: 'test@example.com',
      imageIds: ['img_test123']
    };
    
    // Submit 3 times (should succeed)
    for (let i = 0; i < 3; i++) {
      const response = await fetch('/api/submissions/anonymous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      expect(response.status).toBe(201);
    }
    
    // 4th submission should fail
    const response = await fetch('/api/submissions/anonymous', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    });
    expect(response.status).toBe(429);
    
    const data = await response.json();
    expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(data.error.retryAfter).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Rate Limits Not Working

**Symptoms**:
- Users can submit unlimited times
- No 429 errors returned

**Possible Causes**:
1. Rate limit check commented out
2. IP extraction failing (returns undefined)
3. Server restarted (in-memory data lost)

**Solutions**:
1. Verify rate limit check is active in route handler
2. Log extracted IP addresses to verify correctness
3. Consider Redis for persistent rate limiting

### False Positives

**Symptoms**:
- Legitimate users blocked
- Users behind NAT/proxy affected

**Possible Causes**:
1. Multiple users sharing same IP (office, school, etc.)
2. Limits too restrictive
3. IP extraction getting proxy IP instead of client IP

**Solutions**:
1. Increase rate limits for known shared IPs
2. Adjust limits to be more permissive
3. Fix IP extraction to get real client IP
4. Consider user-based rate limiting (requires accounts)

### Rate Limits Reset Too Quickly

**Symptoms**:
- Users can submit again immediately after limit
- Rate limits don't persist

**Possible Causes**:
1. Server restarted (in-memory data lost)
2. Cleanup removing recent attempts
3. Time window calculations incorrect

**Solutions**:
1. Use Redis for persistent storage
2. Review cleanup logic
3. Verify time window constants

## Best Practices

1. **Monitor Rate Limits**: Track how often limits are hit
2. **Adjust Based on Data**: Use real usage patterns to tune limits
3. **Log Blocked Attempts**: Keep records for abuse analysis
4. **Communicate Clearly**: Show users why they're blocked and when they can retry
5. **Consider Context**: Different limits for different user types
6. **Test Thoroughly**: Verify limits work as expected
7. **Plan for Scale**: Use Redis for multi-server deployments
8. **Review Regularly**: Adjust limits based on platform growth

## Related Documentation

- [Anonymous Submission System](./ANONYMOUS_SUBMISSION_SYSTEM.md)
- [Spam Detection Patterns](./SPAM_DETECTION.md)
- [Admin Submissions API](../src/app/api/admin/submissions/README.md)
