# Spam Detection Patterns

## Overview

The anonymous submission system includes automatic spam detection to flag suspicious submissions for additional admin review. This helps maintain platform quality while allowing legitimate submissions through.

## Detection Strategy

### Philosophy

- **Flag, Don't Block**: Suspicious submissions are flagged for review, not automatically rejected
- **Multiple Signals**: Combine multiple detection patterns for higher confidence
- **Adjustable Sensitivity**: Thresholds can be tuned based on false positive rates
- **Transparent**: Admins see why submissions were flagged

### Confidence Scoring

Each detection pattern contributes to an overall confidence score:

```typescript
interface SpamCheckResult {
  isSpam: boolean;           // Overall determination (confidence > 0.7)
  confidence: number;        // 0-1 confidence score
  reasons: string[];         // List of triggered patterns
  shouldFlag: boolean;       // Whether to flag for review (confidence > 0.5)
}
```

**Thresholds**:
- `confidence > 0.7`: Considered spam (isSpam = true)
- `confidence > 0.5`: Flag for review (shouldFlag = true)
- `confidence ≤ 0.5`: Likely legitimate

## Detection Patterns

### 1. Excessive Capitalization

**Pattern**: More than 50% of alphabetic characters are uppercase

**Examples**:
- ❌ "AMAZING BUSINESS OPPORTUNITY!!!"
- ❌ "BUY NOW LIMITED TIME OFFER"
- ✅ "Mobile App Development Idea"
- ✅ "AI-Powered Analytics Platform"

**Confidence Contribution**: +0.3

**Rationale**: Spam often uses excessive caps to grab attention

**Implementation**:
```typescript
function checkExcessiveCaps(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length === 0) return false;
  
  const upperCount = text.replace(/[^A-Z]/g, '').length;
  const ratio = upperCount / letters.length;
  
  return ratio > 0.5;
}
```

**Edge Cases**:
- Acronyms (e.g., "NASA", "API") are acceptable
- Short titles with caps are less suspicious
- Consider context: "iOS App" vs "IOS APP"

### 2. Repeated Characters

**Pattern**: Same character repeated 5 or more times consecutively

**Examples**:
- ❌ "Greaaaaat idea!!!!"
- ❌ "Wowwwww this is amazing"
- ❌ "Helllllllo"
- ✅ "Great idea!"
- ✅ "Hello world"

**Confidence Contribution**: +0.2

**Rationale**: Indicates low-quality or spam content

**Implementation**:
```typescript
function checkRepeatedChars(text: string): boolean {
  return /(.)\1{4,}/.test(text);
}
```

**Edge Cases**:
- Legitimate repeated chars: "bookkeeper", "committee"
- Numbers: "10000" is acceptable
- Punctuation: "..." is acceptable (only 3 chars)

### 3. Repeated Words

**Pattern**: Same word repeated 3 or more times consecutively

**Examples**:
- ❌ "Buy now now now!"
- ❌ "Free free free money"
- ❌ "Click here here here"
- ✅ "Now is the time"
- ✅ "Free to use"

**Confidence Contribution**: +0.3

**Rationale**: Common spam pattern for emphasis

**Implementation**:
```typescript
function checkRepeatedWords(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  
  for (let i = 0; i < words.length - 2; i++) {
    if (words[i] === words[i + 1] && words[i] === words[i + 2]) {
      return true;
    }
  }
  
  return false;
}
```

**Edge Cases**:
- Stuttering in quotes: "He said 'no no no'"
- Legitimate repetition: "Yes yes yes, that's correct"
- Consider context and frequency

### 4. Spam Keywords

**Pattern**: Contains known spam phrases (case-insensitive)

**Keyword List**:
- "click here"
- "buy now"
- "limited time"
- "act now"
- "free money"
- "guaranteed"
- "no risk"
- "100% free"
- "make money fast"
- "work from home"
- "lose weight"
- "miracle cure"
- "as seen on"
- "call now"
- "order now"
- "special promotion"
- "winner"
- "congratulations"
- "you've been selected"

**Examples**:
- ❌ "Click here to buy now!"
- ❌ "Limited time offer - act now!"
- ❌ "Make money fast working from home"
- ✅ "E-commerce platform for small businesses"
- ✅ "Fitness tracking mobile app"

**Confidence Contribution**: +0.4 per keyword (max +0.8)

**Rationale**: These phrases are strongly associated with spam

**Implementation**:
```typescript
const SPAM_KEYWORDS = [
  'click here',
  'buy now',
  'limited time',
  // ... more keywords
];

function checkSpamKeywords(text: string): {
  found: boolean;
  keywords: string[];
} {
  const lowerText = text.toLowerCase();
  const foundKeywords = SPAM_KEYWORDS.filter(keyword =>
    lowerText.includes(keyword)
  );
  
  return {
    found: foundKeywords.length > 0,
    keywords: foundKeywords
  };
}
```

**Customization**:
- Add industry-specific spam phrases
- Remove false positive keywords
- Adjust based on platform context

### 5. Suspicious URLs

**Pattern**: Contains URLs with suspicious characteristics

**Suspicious Indicators**:
- Free TLDs: .tk, .ml, .ga, .cf, .gq
- URL shorteners: bit.ly, tinyurl.com, goo.gl, t.co
- Excessive subdomains: a.b.c.d.example.com
- IP addresses instead of domains: http://192.168.1.1

**Examples**:
- ❌ "Visit http://example.tk for more info"
- ❌ "Check out bit.ly/abc123"
- ❌ "Go to http://192.168.1.1"
- ✅ "Visit https://example.com"
- ✅ "See our website at company.com"

**Confidence Contribution**: +0.5

**Rationale**: Spam often uses these to hide destination or avoid detection

**Implementation**:
```typescript
const SUSPICIOUS_TLDS = ['.tk', '.ml', '.ga', '.cf', '.gq'];
const URL_SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  'goo.gl',
  't.co',
  'ow.ly',
  'is.gd'
];

function checkSuspiciousUrls(text: string): boolean {
  // Extract URLs
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const urls = text.match(urlRegex) || [];
  
  for (const url of urls) {
    // Check for suspicious TLDs
    if (SUSPICIOUS_TLDS.some(tld => url.includes(tld))) {
      return true;
    }
    
    // Check for URL shorteners
    if (URL_SHORTENERS.some(shortener => url.includes(shortener))) {
      return true;
    }
    
    // Check for IP addresses
    if (/https?:\/\/\d+\.\d+\.\d+\.\d+/.test(url)) {
      return true;
    }
  }
  
  return false;
}
```

**Edge Cases**:
- Legitimate use of URL shorteners (rare in business ideas)
- Internal IP addresses in technical descriptions
- Consider whitelisting known domains

### 6. Invalid Contact Patterns

**Pattern**: Contact information with suspicious characteristics

**Suspicious Indicators**:
- Disposable email domains: tempmail.com, guerrillamail.com, 10minutemail.com
- Email with excessive numbers: user12345678@example.com
- Phone numbers with invalid formats
- Generic emails: test@test.com, admin@admin.com

**Examples**:
- ❌ "user12345678@tempmail.com"
- ❌ "test@test.com"
- ❌ "+1-000-000-0000"
- ✅ "john.doe@company.com"
- ✅ "+1-555-123-4567"

**Confidence Contribution**: +0.3

**Rationale**: Spam often uses fake or disposable contact info

**Implementation**:
```typescript
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'mailinator.com',
  'throwaway.email'
];

function checkInvalidContact(
  email?: string,
  phone?: string
): boolean {
  // Check disposable email
  if (email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
      return true;
    }
    
    // Check for excessive numbers in email
    const localPart = email.split('@')[0];
    const digitCount = (localPart.match(/\d/g) || []).length;
    if (digitCount > 6) {
      return true;
    }
  }
  
  // Check invalid phone patterns
  if (phone) {
    // All zeros or ones
    if (/^[+\-\s()]*[01]+[+\-\s()]*$/.test(phone)) {
      return true;
    }
  }
  
  return false;
}
```

**Edge Cases**:
- Legitimate numbered emails: user123@company.com
- Test accounts during development
- International phone formats

## Confidence Calculation

### Scoring Algorithm

```typescript
function detectSpamPatterns(submission: {
  title: string;
  description: string;
  contactEmail?: string;
  contactPhone?: string;
}): SpamCheckResult {
  let confidence = 0;
  const reasons: string[] = [];
  
  const fullText = `${submission.title} ${submission.description}`;
  
  // Check each pattern
  if (checkExcessiveCaps(fullText)) {
    confidence += 0.3;
    reasons.push('Excessive capitalization');
  }
  
  if (checkRepeatedChars(fullText)) {
    confidence += 0.2;
    reasons.push('Repeated characters');
  }
  
  if (checkRepeatedWords(fullText)) {
    confidence += 0.3;
    reasons.push('Repeated words');
  }
  
  const keywordCheck = checkSpamKeywords(fullText);
  if (keywordCheck.found) {
    const keywordScore = Math.min(keywordCheck.keywords.length * 0.4, 0.8);
    confidence += keywordScore;
    reasons.push(`Spam keywords: ${keywordCheck.keywords.join(', ')}`);
  }
  
  if (checkSuspiciousUrls(fullText)) {
    confidence += 0.5;
    reasons.push('Suspicious URLs');
  }
  
  if (checkInvalidContact(submission.contactEmail, submission.contactPhone)) {
    confidence += 0.3;
    reasons.push('Invalid contact information');
  }
  
  // Cap confidence at 1.0
  confidence = Math.min(confidence, 1.0);
  
  return {
    isSpam: confidence > 0.7,
    confidence,
    reasons,
    shouldFlag: confidence > 0.5
  };
}
```

### Threshold Tuning

**Current Thresholds**:
- `isSpam`: 0.7 (high confidence)
- `shouldFlag`: 0.5 (moderate confidence)

**Adjusting for False Positives**:
- Increase thresholds to reduce false positives
- Example: `shouldFlag: 0.6` for stricter flagging

**Adjusting for False Negatives**:
- Decrease thresholds to catch more spam
- Example: `shouldFlag: 0.4` for more aggressive flagging

**Monitoring**:
- Track flagged vs. approved/rejected ratios
- Review false positives manually
- Adjust thresholds based on data

## Integration with Submission Flow

### Submission Creation

```typescript
// In createAnonymousSubmission
const spamCheck = detectSpamPatterns(submission);

const submissionRecord = await prisma.anonymousSubmission.create({
  data: {
    ...submission,
    flaggedForReview: spamCheck.shouldFlag,
    flagReason: spamCheck.shouldFlag
      ? spamCheck.reasons.join('; ')
      : null,
  }
});
```

### Admin Interface

**Flagged Indicator**:
- Submissions with `flaggedForReview: true` show warning icon
- Flag reason displayed in submission details
- Admins can manually unflag false positives

**Filtering**:
- Filter moderation queue by flagged status
- Prioritize flagged submissions for review
- Track flagged submission statistics

## Configuration

### Adjusting Patterns

Edit `src/lib/spam-detection.ts`:

```typescript
// Adjust capitalization threshold
const CAPS_THRESHOLD = 0.5; // 50% uppercase

// Adjust repeated character count
const REPEATED_CHAR_COUNT = 5; // 5 consecutive

// Add/remove spam keywords
const SPAM_KEYWORDS = [
  'click here',
  'buy now',
  // Add more keywords
];

// Add/remove suspicious TLDs
const SUSPICIOUS_TLDS = [
  '.tk',
  '.ml',
  // Add more TLDs
];

// Adjust confidence thresholds
const IS_SPAM_THRESHOLD = 0.7;
const SHOULD_FLAG_THRESHOLD = 0.5;
```

### Disabling Detection

**Not recommended**, but possible for testing:

```typescript
// In src/app/api/submissions/anonymous/route.ts
// Comment out spam detection:
/*
const spamCheck = detectSpamPatterns({
  title: validatedData.title,
  description: validatedData.description,
  contactEmail: validatedData.contactEmail,
  contactPhone: validatedData.contactPhone,
});
*/

// Use default values:
const spamCheck = {
  isSpam: false,
  confidence: 0,
  reasons: [],
  shouldFlag: false
};
```

## Testing

### Unit Tests

```typescript
describe('Spam Detection', () => {
  test('detects excessive capitalization', () => {
    const result = detectSpamPatterns({
      title: 'AMAZING OPPORTUNITY',
      description: 'BUY NOW LIMITED TIME',
    });
    
    expect(result.shouldFlag).toBe(true);
    expect(result.reasons).toContain('Excessive capitalization');
  });
  
  test('detects spam keywords', () => {
    const result = detectSpamPatterns({
      title: 'Business Idea',
      description: 'Click here to buy now and make money fast!',
    });
    
    expect(result.shouldFlag).toBe(true);
    expect(result.reasons.some(r => r.includes('Spam keywords'))).toBe(true);
  });
  
  test('allows legitimate submissions', () => {
    const result = detectSpamPatterns({
      title: 'Mobile App Development',
      description: 'A mobile app for tracking fitness goals and nutrition.',
      contactEmail: 'john@company.com',
    });
    
    expect(result.shouldFlag).toBe(false);
    expect(result.confidence).toBeLessThan(0.5);
  });
});
```

### Manual Testing

**Test Spam Patterns**:
```bash
# Test excessive caps
curl -X POST http://localhost:3000/api/submissions/anonymous \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AMAZING BUSINESS OPPORTUNITY",
    "description": "BUY NOW LIMITED TIME OFFER CLICK HERE",
    "budgetMin": 1000,
    "budgetMax": 5000,
    "contactEmail": "test@example.com",
    "imageIds": ["img_test123"]
  }'

# Check if submission is flagged
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/api/admin/submissions/<submission-id>
```

## Monitoring

### Metrics to Track

1. **Flagging Rate**: Percentage of submissions flagged
2. **False Positive Rate**: Flagged submissions that are approved
3. **False Negative Rate**: Spam that wasn't flagged
4. **Pattern Distribution**: Which patterns trigger most often
5. **Confidence Distribution**: Distribution of confidence scores

### Logging

```typescript
// Log spam detection results
console.log('Spam check:', {
  submissionId: submission.id,
  confidence: spamCheck.confidence,
  flagged: spamCheck.shouldFlag,
  reasons: spamCheck.reasons
});
```

### Dashboard

Consider adding to admin dashboard:
- Flagged submission count
- Most common spam patterns
- False positive rate
- Trend over time

## Handling False Positives

### Manual Unflagging

Admins can manually unflag submissions:

```typescript
// In admin interface
async function unflagSubmission(submissionId: string) {
  await prisma.anonymousSubmission.update({
    where: { id: submissionId },
    data: {
      flaggedForReview: false,
      flagReason: null
    }
  });
  
  // Create audit log
  await prisma.submissionAuditLog.create({
    data: {
      submissionId,
      action: 'UNFLAGGED',
      performedBy: adminUserId,
      details: { reason: 'False positive' }
    }
  });
}
```

### Pattern Refinement

When false positives occur:
1. Review the triggered patterns
2. Identify common false positive cases
3. Adjust pattern logic or thresholds
4. Add exceptions for legitimate cases
5. Test with historical data

### Whitelist

Consider whitelisting for known good patterns:
- Trusted email domains
- Known business terminology
- Industry-specific jargon

## Advanced Detection

### Future Enhancements

1. **Machine Learning**: Train model on historical spam/legitimate submissions
2. **Bayesian Filtering**: Use probabilistic approach like email spam filters
3. **Behavioral Analysis**: Track submission patterns over time
4. **Content Similarity**: Detect duplicate or near-duplicate submissions
5. **External APIs**: Integrate with spam detection services (Akismet, etc.)
6. **Natural Language Processing**: Analyze text quality and coherence
7. **Image Analysis**: Detect spam in uploaded images
8. **Reputation System**: Track IP/email reputation scores

### Machine Learning Approach

```typescript
// Pseudocode for ML-based detection
import { SpamClassifier } from './ml-spam-classifier';

const classifier = new SpamClassifier();

// Train on historical data
await classifier.train(historicalSubmissions);

// Predict spam probability
const prediction = await classifier.predict(submission);

// Combine with rule-based detection
const finalConfidence = (
  prediction.probability * 0.7 +
  ruleBasedConfidence * 0.3
);
```

## Best Practices

1. **Start Conservative**: Begin with higher thresholds, adjust based on data
2. **Monitor Continuously**: Track false positive/negative rates
3. **Iterate Quickly**: Adjust patterns based on new spam tactics
4. **Communicate Clearly**: Show admins why submissions were flagged
5. **Allow Manual Override**: Admins can unflag false positives
6. **Document Changes**: Keep log of pattern adjustments
7. **Test Thoroughly**: Verify changes don't increase false positives
8. **Consider Context**: Platform-specific spam patterns may differ

## Troubleshooting

### Too Many False Positives

**Symptoms**:
- Legitimate submissions frequently flagged
- Admins spending time unflagging

**Solutions**:
- Increase `shouldFlag` threshold (e.g., 0.6)
- Review and remove overly aggressive patterns
- Add exceptions for common false positive cases
- Reduce confidence contributions for specific patterns

### Missing Obvious Spam

**Symptoms**:
- Spam submissions not flagged
- Manual rejection rate high

**Solutions**:
- Decrease `shouldFlag` threshold (e.g., 0.4)
- Add new spam keywords based on observed patterns
- Increase confidence contributions for reliable patterns
- Review spam submissions to identify new patterns

### Pattern Not Triggering

**Symptoms**:
- Expected pattern doesn't flag submissions
- Confidence scores lower than expected

**Solutions**:
- Verify pattern logic with test cases
- Check for case sensitivity issues
- Review regex patterns for correctness
- Add logging to debug pattern matching

## Related Documentation

- [Anonymous Submission System](./ANONYMOUS_SUBMISSION_SYSTEM.md)
- [Rate Limiting Configuration](./RATE_LIMITING.md)
- [Admin Submissions API](../src/app/api/admin/submissions/README.md)
