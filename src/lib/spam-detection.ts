/**
 * Spam Detection Service
 * 
 * Detects spam patterns in anonymous business idea submissions
 * to help maintain platform quality and reduce moderation burden.
 */

export interface SpamCheckResult {
  isSpam: boolean;
  confidence: number; // 0-1 scale
  reasons: string[];
  shouldFlag: boolean;
}

interface SubmissionContent {
  title: string;
  description: string;
  contactEmail?: string;
  contactPhone?: string;
}

// Spam detection thresholds
const THRESHOLDS = {
  CAPITALIZATION_RATIO: 0.5, // 50% or more uppercase
  REPEATED_CHAR_LENGTH: 5, // 5+ repeated characters
  SPAM_KEYWORD_COUNT: 2, // 2+ spam keywords
  SUSPICIOUS_URL_COUNT: 3, // 3+ URLs
  FLAG_CONFIDENCE: 0.6, // Flag if confidence >= 60%
};

// Known spam keywords (case-insensitive)
const SPAM_KEYWORDS = [
  'viagra',
  'cialis',
  'casino',
  'lottery',
  'winner',
  'congratulations',
  'click here',
  'buy now',
  'limited time',
  'act now',
  'free money',
  'make money fast',
  'work from home',
  'no experience',
  'guaranteed',
  'risk free',
  'double your',
  'earn extra cash',
  'weight loss',
  'lose weight',
  'bitcoin',
  'cryptocurrency investment',
  'forex trading',
  'binary options',
];

// Suspicious URL patterns
const SUSPICIOUS_URL_PATTERNS = [
  /bit\.ly/i,
  /tinyurl/i,
  /goo\.gl/i,
  /t\.co/i,
  /ow\.ly/i,
  /is\.gd/i,
  /buff\.ly/i,
  /adf\.ly/i,
];

/**
 * Detects spam patterns in a submission
 */
export function detectSpamPatterns(submission: SubmissionContent): SpamCheckResult {
  const reasons: string[] = [];
  let confidenceScore = 0;
  const maxConfidence = 5; // Total number of checks

  // Check 1: Excessive capitalization
  if (hasExcessiveCapitalization(submission.title) || 
      hasExcessiveCapitalization(submission.description)) {
    reasons.push('Excessive capitalization detected');
    confidenceScore += 1;
  }

  // Check 2: Repeated characters
  if (hasRepeatedCharacters(submission.title) || 
      hasRepeatedCharacters(submission.description)) {
    reasons.push('Repeated characters detected');
    confidenceScore += 1;
  }

  // Check 3: Spam keywords
  const spamKeywordCount = countSpamKeywords(
    `${submission.title} ${submission.description}`
  );
  if (spamKeywordCount >= THRESHOLDS.SPAM_KEYWORD_COUNT) {
    reasons.push(`Multiple spam keywords detected (${spamKeywordCount})`);
    confidenceScore += 1;
  }

  // Check 4: Suspicious URLs
  const suspiciousUrlCount = countSuspiciousUrls(submission.description);
  if (suspiciousUrlCount >= THRESHOLDS.SUSPICIOUS_URL_COUNT) {
    reasons.push(`Multiple suspicious URLs detected (${suspiciousUrlCount})`);
    confidenceScore += 1;
  }

  // Check 5: Invalid contact patterns
  if (hasInvalidContactPatterns(submission.contactEmail, submission.contactPhone)) {
    reasons.push('Invalid contact information patterns detected');
    confidenceScore += 1;
  }

  // Calculate normalized confidence (0-1)
  const confidence = confidenceScore / maxConfidence;

  // Determine if submission should be flagged
  const shouldFlag = confidence >= THRESHOLDS.FLAG_CONFIDENCE;

  return {
    isSpam: shouldFlag,
    confidence,
    reasons,
    shouldFlag,
  };
}

/**
 * Checks if text has excessive capitalization
 */
function hasExcessiveCapitalization(text: string): boolean {
  if (!text || text.length < 10) {
    return false; // Too short to determine
  }

  // Count letters only (ignore numbers, spaces, punctuation)
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length === 0) {
    return false;
  }

  const uppercaseCount = (text.match(/[A-Z]/g) || []).length;
  const ratio = uppercaseCount / letters.length;

  return ratio >= THRESHOLDS.CAPITALIZATION_RATIO;
}

/**
 * Checks if text has repeated characters
 */
function hasRepeatedCharacters(text: string): boolean {
  if (!text) {
    return false;
  }

  // Pattern: same character repeated 5+ times
  const repeatedPattern = /(.)\1{4,}/;
  return repeatedPattern.test(text);
}

/**
 * Counts spam keywords in text
 */
function countSpamKeywords(text: string): number {
  if (!text) {
    return 0;
  }

  const lowerText = text.toLowerCase();
  let count = 0;

  for (const keyword of SPAM_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      count++;
    }
  }

  return count;
}

/**
 * Counts suspicious URLs in text
 */
function countSuspiciousUrls(text: string): number {
  if (!text) {
    return 0;
  }

  let count = 0;

  for (const pattern of SUSPICIOUS_URL_PATTERNS) {
    const matches = text.match(new RegExp(pattern, 'g'));
    if (matches) {
      count += matches.length;
    }
  }

  return count;
}

/**
 * Checks for invalid contact information patterns
 */
function hasInvalidContactPatterns(
  email?: string,
  phone?: string
): boolean {
  // Check for obviously fake emails
  if (email) {
    const fakeEmailPatterns = [
      /test@test/i,
      /fake@fake/i,
      /spam@spam/i,
      /noreply@/i,
      /no-reply@/i,
      /example@example/i,
      /temp@temp/i,
      /throwaway@/i,
    ];

    for (const pattern of fakeEmailPatterns) {
      if (pattern.test(email)) {
        return true;
      }
    }
  }

  // Check for obviously fake phone numbers
  if (phone) {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Check for repeated digits (e.g., 1111111111, 0000000000)
    if (/^(\d)\1+$/.test(digits)) {
      return true;
    }

    // Check for sequential digits (e.g., 1234567890)
    if (digits === '1234567890' || digits === '0123456789') {
      return true;
    }
  }

  return false;
}
