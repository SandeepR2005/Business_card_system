import { Lead } from '../types';
import { CURRENT_USER } from './data';
// Note: expo-file-system is intentionally NOT used here.
// We receive base64 directly from expo-camera's takePictureAsync({ base64: true })
// to avoid FileSystem native module issues in Expo Go.

export interface ExtractedCard {
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  confidence: {
    name: number;
    role: number;
    company: number;
    email: number;
    phone: number;
    location: number;
  };
  rawText: string;
}

/**
 * OCR Service — Extracts business card data from real captured images.
 *
 * Uses OCR.space API — completely FREE, no billing required.
 *   • Free tier: 25,000 requests / month
 *   • No credit card needed
 *   • Demo key 'helloworld' works instantly for testing
 *   • Get a free production key at: https://ocr.space/ocrapi (email signup only)
 *
 * How to get your free key:
 *   1. Go to https://ocr.space/ocrapi/freekey
 *   2. Enter your email — a key is sent instantly
 *   3. Paste it below (leave 'helloworld' for quick testing)
 */

// ── CONFIG ──────────────────────────────────────────────────────────────────
// 'helloworld' is the free demo key — works immediately, limited to small images.
// Replace with your free key from https://ocr.space/ocrapi/freekey for full use.
const OCR_SPACE_API_KEY = 'K82221583688957'; // e.g. 'K81234567890ABCD'

// OCR.space API endpoint
const OCR_SPACE_URL = 'https://api.ocr.space/parse/image';
// ────────────────────────────────────────────────────────────────────────────

export class OCRService {
  /**
   * Call OCR.space API (FREE — no billing required) with a base64 image string.
   * Returns the full detected text.
   *
   * API docs: https://ocr.space/ocrapi
   * Free key:  https://ocr.space/ocrapi/freekey  (email only, no credit card)
   */
  private static async callOCRSpace(base64Image: string): Promise<string> {
    if (!base64Image || base64Image.length === 0) {
      throw new Error('No image data provided to OCR service');
    }

    // Log size so we can detect if image is too large for the API
    const sizeKB = Math.round(base64Image.length / 1024);
    console.log(`📊 Image base64 size: ${sizeKB} KB`);
    if (sizeKB > 900) {
      console.warn(`⚠️ Image is ${sizeKB} KB — OCR.space free key limit is ~1024 KB. Consider reducing quality.`);
    }

    // Use application/x-www-form-urlencoded — more reliable than FormData
    // for large string payloads in React Native's fetch implementation.
    const body = [
      `apikey=${encodeURIComponent(OCR_SPACE_API_KEY)}`,
      `base64Image=${encodeURIComponent(`data:image/jpeg;base64,${base64Image}`)}`,
      `language=eng`,
      `scale=true`,
      `isTable=false`,
      `OCREngine=2`,
    ].join('&');

    console.log('🌐 Sending request to OCR.space…');
    const response = await fetch(OCR_SPACE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const responseText = await response.text();
    console.log('📨 OCR.space raw response:', responseText.substring(0, 500));

    if (!response.ok) {
      throw new Error(`OCR.space HTTP error ${response.status}: ${responseText}`);
    }

    let json: any;
    try {
      json = JSON.parse(responseText);
    } catch {
      throw new Error(`OCR.space returned invalid JSON: ${responseText.substring(0, 200)}`);
    }

    // Check for API-level errors
    if (json.IsErroredOnProcessing) {
      const msg = Array.isArray(json.ErrorMessage)
        ? json.ErrorMessage.join(', ')
        : String(json.ErrorMessage ?? 'Unknown error');
      throw new Error(`OCR.space processing error: ${msg}`);
    }

    const parsedResults = json?.ParsedResults;
    if (!parsedResults || parsedResults.length === 0) {
      console.warn('⚠️ OCR.space returned no ParsedResults — full response:', JSON.stringify(json));
      return '';
    }

    const text = parsedResults[0].ParsedText ?? '';
    console.log('✅ OCR.space parsed text length:', text.length);
    return text;
  }

  /**
   * Main OCR entry point.
   * Accepts the base64 string directly from expo-camera's takePictureAsync({ base64: true }).
   * This avoids expo-file-system entirely, which caused "Error: Method getInfoAsync" in Expo Go.
   *
   * @param base64Image - Raw base64 string (no data URI prefix) from photo.base64
   */
  static async analyzeImageAndExtractText(base64Image: string): Promise<string> {
    console.log('=== 📸 OCR: analyzeImageAndExtractText ===');
    console.log('Base64 length:', base64Image?.length ?? 0);

    if (!base64Image || base64Image.trim().length === 0) {
      console.warn('⚠️ No base64 image data — returning empty result.');
      return '';
    }

    try {
      const text = await this.callOCRSpace(base64Image);
      if (text.trim()) {
        console.log('✅ OCR.space raw text:\n', text);
        return text;
      }
      console.warn('⚠️ OCR.space returned empty text.');
      return '';
    } catch (err) {
      // Log the FULL error so it's visible in Metro console for debugging
      console.error('❌ OCR.space call failed with error:', err);
      return '';
    }
  }

  /**
   * Parse raw OCR text and extract structured business-card fields.
   * Handles a wide variety of card layouts.
   */
  static parseBusinessCardText(text: string): Partial<ExtractedCard> {
    const extracted: Partial<ExtractedCard> = {
      name: '',
      role: '',
      company: '',
      email: '',
      phone: '',
      location: '',
      confidence: {
        name: 0,
        role: 0,
        company: 0,
        email: 0,
        phone: 0,
        location: 0,
      },
      rawText: text,
    };

    if (!text || text.trim().length === 0) {
      // Nothing to parse — return empty fields so the user fills in manually
      return extracted;
    }

    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // ── Pattern matchers ───────────────────────────────────────────────────
    const emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
    // Handles: +91 98765 43210 | +1-800-555-1234 | (555) 123-4567 | 10-digit numbers
    const phoneRe =
      /(\+\d{1,3}[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}|(\+\d{1,3}[\s\-.]?)?\d{5}\s?\d{5}/;

    const roleKeywords = [
      'ceo', 'cto', 'cfo', 'coo', 'cmo', 'vp', 'vice president',
      'director', 'manager', 'engineer', 'architect', 'specialist',
      'executive', 'founder', 'president', 'lead', 'head', 'consultant',
      'officer', 'analyst', 'associate', 'partner', 'principal',
      'developer', 'designer', 'scientist', 'coordinator',
    ];
    const companyKeywords = [
      'inc', 'ltd', 'llc', 'corp', 'co.', 'company', 'solutions',
      'labs', 'lab', 'technologies', 'tech', 'services', 'group',
      'enterprises', 'systems', 'analytics', 'consulting', 'advisors',
      'global', 'international', 'ventures', 'studios', 'agency',
    ];
    const locationKeywords = [
      // India
      'bengaluru', 'bangalore', 'mumbai', 'delhi', 'hyderabad', 'pune',
      'chennai', 'kolkata', 'kochi', 'india', 'ka', 'mh', 'tg', 'dl', 'tn',
      // US
      'california', 'new york', 'san francisco', 'seattle', 'austin',
      'chicago', 'boston', 'los angeles', 'ny', 'ca', 'tx', 'wa',
      // Generic
      'usa', 'uk', 'canada', 'singapore', 'dubai', 'uae',
    ];
    const websiteRe = /(?:www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/\S*)?/;

    let nameConfidence = 0;
    let roleConfidence = 0;
    let companyConfidence = 0;
    let locationConfidence = 0;

    // Track which lines have been "claimed" to avoid double-assignment
    const claimed = new Set<number>();

    // ── Step 1: Extract email (highest confidence) ─────────────────────────
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(emailRe);
      if (m) {
        extracted.email = m[0].toLowerCase();
        extracted.confidence!.email = 0.98;
        claimed.add(i);
        break;
      }
    }

    // ── Step 2: Extract phone ──────────────────────────────────────────────
    for (let i = 0; i < lines.length; i++) {
      if (claimed.has(i)) continue;
      const m = lines[i].match(phoneRe);
      if (m) {
        extracted.phone = m[0].replace(/\s+/g, ' ').trim();
        extracted.confidence!.phone = 0.95;
        claimed.add(i);
        break;
      }
    }

    // ── Step 3: Extract role / title ───────────────────────────────────────
    for (let i = 0; i < lines.length; i++) {
      if (claimed.has(i)) continue;
      const lower = lines[i].toLowerCase();
      for (const kw of roleKeywords) {
        if (lower.includes(kw)) {
          extracted.role = lines[i];
          roleConfidence = 0.88;
          extracted.confidence!.role = roleConfidence;
          claimed.add(i);
          break;
        }
      }
      if (extracted.role) break;
    }

    // ── Step 4: Extract company ────────────────────────────────────────────
    for (let i = 0; i < lines.length; i++) {
      if (claimed.has(i)) continue;
      const lower = lines[i].toLowerCase();
      for (const kw of companyKeywords) {
        if (lower.includes(kw)) {
          extracted.company = lines[i];
          companyConfidence = 0.82;
          extracted.confidence!.company = companyConfidence;
          claimed.add(i);
          break;
        }
      }
      if (extracted.company) break;
    }

    // ── Step 5: Extract location ───────────────────────────────────────────
    for (let i = 0; i < lines.length; i++) {
      if (claimed.has(i)) continue;
      const lower = lines[i].toLowerCase();
      for (const kw of locationKeywords) {
        if (lower.includes(kw)) {
          extracted.location = lines[i];
          locationConfidence = 0.80;
          extracted.confidence!.location = locationConfidence;
          claimed.add(i);
          break;
        }
      }
      if (extracted.location) break;
    }

    // ── Step 6: Skip website lines ─────────────────────────────────────────
    for (let i = 0; i < lines.length; i++) {
      if (claimed.has(i)) continue;
      const lower = lines[i].toLowerCase();
      if (
        lower.startsWith('www.') ||
        lower.includes('.com') ||
        lower.includes('.io') ||
        lower.includes('.co') ||
        lower.includes('.in')
      ) {
        if (!lines[i].includes('@')) {
          // It's a website, not an email — skip it
          claimed.add(i);
        }
      }
    }

    // ── Step 7: First unclaimed line with capital letter = name ───────────
    for (let i = 0; i < lines.length; i++) {
      if (claimed.has(i)) continue;
      const line = lines[i];
      const lower = line.toLowerCase();
      // Must start with a capital letter, be a reasonable length,
      // not look like a company/role/location already picked
      const hasCapital = /^[A-Z]/.test(line);
      const isReasonableLength = line.length >= 4 && line.length <= 60;
      const looksLikeName =
        hasCapital && isReasonableLength && !line.includes('@');
      if (looksLikeName) {
        extracted.name = line;
        nameConfidence = 0.88;
        extracted.confidence!.name = nameConfidence;
        claimed.add(i);
        break;
      }
    }

    // ── Step 8: If company still missing, use second unclaimed line ────────
    if (!extracted.company) {
      let count = 0;
      for (let i = 0; i < lines.length; i++) {
        if (claimed.has(i)) continue;
        count++;
        if (count === 1) {
          // Could be the company name
          extracted.company = lines[i];
          companyConfidence = 0.55;
          extracted.confidence!.company = companyConfidence;
          claimed.add(i);
          break;
        }
      }
    }

    // ── Confidence summaries ───────────────────────────────────────────────
    if (extracted.confidence) {
      if (!extracted.confidence.name) extracted.confidence.name = nameConfidence;
      if (!extracted.confidence.role) extracted.confidence.role = roleConfidence;
      if (!extracted.confidence.company) extracted.confidence.company = companyConfidence;
      if (!extracted.confidence.location) extracted.confidence.location = locationConfidence;
    }

    return extracted;
  }

  /**
   * Full pipeline: base64 image → OCR → parse → return ExtractedCard.
   *
   * @param base64Image - Raw base64 string from expo-camera's photo.base64
   *                      (do NOT include the 'data:image/jpeg;base64,' prefix)
   */
  static async extractCard(base64Image: string): Promise<ExtractedCard> {
    try {
      console.log('=== 🚀 OCR Pipeline Start ===');

      const rawText = await this.analyzeImageAndExtractText(base64Image);
      const parsed = this.parseBusinessCardText(rawText);

      console.log('=== ✅ OCR Pipeline Complete ===');
      console.log('Parsed result:', parsed);

      return parsed as ExtractedCard;
    } catch (error) {
      console.error('❌ OCR pipeline error:', error);
      // Return blank card so the user can type manually
      return {
        name: '',
        role: '',
        company: '',
        email: '',
        phone: '',
        location: '',
        confidence: {
          name: 0,
          role: 0,
          company: 0,
          email: 0,
          phone: 0,
          location: 0,
        },
        rawText: '',
      };
    }
  }

  /**
   * Convert an ExtractedCard into the Lead model.
   */
  static createLeadFromExtraction(
    extracted: ExtractedCard,
    eventName: string = 'Event',
  ): Lead {
    const now = new Date();
    const safeName = extracted.name || 'New Lead';
    const id = safeName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();

    const lead: Lead = {
      id,
      name: safeName,
      role: extracted.role || '',
      company: extracted.company || '',
      email: extracted.email || '',
      phone: extracted.phone || '',
      location: extracted.location || '',
      status: 'new',
      event: eventName,
      capturedAt: this.getTimeAgo(now),
      capturedBy: CURRENT_USER.id,
      tags: [],
      note: '',
      score: this.calculateScore(extracted),
      scoreBreak: {
        designation: Math.round(extracted.confidence.role * 20),
        company: Math.round(extracted.confidence.company * 20),
        email: Math.round(extracted.confidence.email * 20),
        brochure: 0,
        event: 18,
      },
      followUp: {
        date: this.getFollowUpDate(now),
        daysFromNow: 3,
        overdue: false,
        suggested: 'Follow-up after event',
      },
      reminder: null,
      activity: [
        {
          t: this.getTimeAgo(now),
          k: 'scan',
          text: extracted.company
            ? `Captured business card for ${extracted.company}`
            : 'Captured business card',
        },
      ],
    };

    return lead;
  }

  private static calculateScore(extracted: ExtractedCard): number {
    const weights = {
      name: 0.25,
      role: 0.2,
      company: 0.2,
      email: 0.15,
      phone: 0.1,
      location: 0.1,
    };
    const score =
      extracted.confidence.name * weights.name +
      extracted.confidence.role * weights.role +
      extracted.confidence.company * weights.company +
      extracted.confidence.email * weights.email +
      extracted.confidence.phone * weights.phone +
      extracted.confidence.location * weights.location;
    return Math.round(score * 100);
  }

  private static getTimeAgo(date: Date): string {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  private static getFollowUpDate(baseDate: Date): string {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

export default OCRService;
