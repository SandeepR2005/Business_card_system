import { Lead } from '../types';
import { CURRENT_USER } from './data';

// ---------------------------------------------------------------------------
// OCR.space API — free tier, no billing required
// Get your own free key at https://ocr.space/ocrapi (or use the demo key below)
// ---------------------------------------------------------------------------
const OCR_SPACE_API_KEY = 'K88912816488957'; // free demo key — replace with your own if rate-limited

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
  cardQuality?: number;
  cardDetected?: boolean;
  cardOrientation?: number;
}

export class OCRService {
  // ─────────────────────────────────────────────────────────────────────────
  // Step 1 — Send image to OCR.space, get raw text back
  // ─────────────────────────────────────────────────────────────────────────
  private static async getRawTextFromImage(base64Image: string): Promise<string> {
    console.log('📡 Sending image to OCR.space API...');

    const body = new FormData();
    body.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
    body.append('apikey', OCR_SPACE_API_KEY);
    body.append('language', 'eng');
    body.append('isOverlayRequired', 'false');
    body.append('detectOrientation', 'true');
    body.append('scale', 'true');
    body.append('isTable', 'false');
    body.append('OCREngine', '2'); // Engine 2 is better for printed text / cards

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body,
    });

    if (!response.ok) {
      throw new Error(`OCR.space HTTP error: ${response.status}`);
    }

    const json = await response.json();
    console.log('📄 OCR.space raw response:', JSON.stringify(json).slice(0, 300));

    if (json.IsErroredOnProcessing) {
      throw new Error(`OCR.space error: ${json.ErrorMessage}`);
    }

    const text: string =
      json?.ParsedResults?.[0]?.ParsedText ?? '';

    console.log(`✅ OCR.space returned ${text.length} chars of text`);
    console.log('📝 Raw OCR text:\n', text);
    return text;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2 — Parse the raw text into structured card fields
  // ─────────────────────────────────────────────────────────────────────────
  private static parseBusinessCardText(text: string): Partial<ExtractedCard> {
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
      return extracted;
    }

    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // ── Pattern matchers ───────────────────────────────────────────────────
    const emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
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
      'bengaluru', 'bangalore', 'mumbai', 'delhi', 'hyderabad', 'pune',
      'chennai', 'kolkata', 'kochi', 'india', 'ka', 'mh', 'tg', 'dl', 'tn',
      'california', 'new york', 'san francisco', 'seattle', 'austin',
      'chicago', 'boston', 'los angeles', 'ny', 'ca', 'tx', 'wa',
      'usa', 'uk', 'canada', 'singapore', 'dubai', 'uae',
    ];

    let nameConfidence = 0;
    let roleConfidence = 0;
    let companyConfidence = 0;
    let locationConfidence = 0;

    const claimed = new Set<number>();

    // ── Extract email ──────────────────────────────────────────────────────
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(emailRe);
      if (m) {
        extracted.email = m[0].toLowerCase();
        extracted.confidence!.email = 0.98;
        claimed.add(i);
        break;
      }
    }

    // ── Extract phone ──────────────────────────────────────────────────────
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

    // ── Extract role ───────────────────────────────────────────────────────
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

    // ── Extract company ────────────────────────────────────────────────────
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

    // ── Extract location ───────────────────────────────────────────────────
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

    // ── Skip website lines ─────────────────────────────────────────────────
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
          claimed.add(i);
        }
      }
    }

    // ── First unclaimed line with capital letter = name ────────────────────
    for (let i = 0; i < lines.length; i++) {
      if (claimed.has(i)) continue;
      const line = lines[i];
      const hasCapital = /^[A-Z]/.test(line);
      const isReasonableLength = line.length >= 4 && line.length <= 60;
      const looksLikeName = hasCapital && isReasonableLength && !line.includes('@');
      if (looksLikeName) {
        extracted.name = line;
        nameConfidence = 0.88;
        extracted.confidence!.name = nameConfidence;
        claimed.add(i);
        break;
      }
    }

    // ── If company still missing, use first remaining unclaimed line ────────
    if (!extracted.company) {
      for (let i = 0; i < lines.length; i++) {
        if (claimed.has(i)) continue;
        extracted.company = lines[i];
        companyConfidence = 0.55;
        extracted.confidence!.company = companyConfidence;
        claimed.add(i);
        break;
      }
    }

    // ── Confidence summaries ───────────────────────────────────────────────
    if (extracted.confidence) {
      if (!extracted.confidence.name)     extracted.confidence.name     = nameConfidence;
      if (!extracted.confidence.role)     extracted.confidence.role     = roleConfidence;
      if (!extracted.confidence.company)  extracted.confidence.company  = companyConfidence;
      if (!extracted.confidence.location) extracted.confidence.location = locationConfidence;
    }

    return extracted;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public entry point: base64 image → ExtractedCard
  // ─────────────────────────────────────────────────────────────────────────
  static async extractCard(base64Image: string): Promise<ExtractedCard> {
    console.log('=== 🚀 OCR Pipeline Start ===');

    const blank: ExtractedCard = {
      name: '', role: '', company: '', email: '', phone: '', location: '',
      confidence: { name: 0, role: 0, company: 0, email: 0, phone: 0, location: 0 },
      rawText: '',
      cardDetected: false,
      cardQuality: 0,
      cardOrientation: 0,
    };

    if (!base64Image || base64Image.trim().length === 0) {
      console.warn('⚠️ No image data provided');
      return blank;
    }

    try {
      // 1. Get raw text from the real OCR engine
      const rawText = await this.getRawTextFromImage(base64Image);

      if (!rawText || rawText.trim().length === 0) {
        console.warn('⚠️ OCR returned no text — image may be too dark/blurry');
        return { ...blank, rawText: '' };
      }

      // 2. Parse into structured fields
      const parsed = this.parseBusinessCardText(rawText);

      const result: ExtractedCard = {
        name:     parsed.name     ?? '',
        role:     parsed.role     ?? '',
        company:  parsed.company  ?? '',
        email:    parsed.email    ?? '',
        phone:    parsed.phone    ?? '',
        location: parsed.location ?? '',
        confidence: parsed.confidence ?? blank.confidence,
        rawText,
        cardDetected: true,
        cardQuality: 0.85,
        cardOrientation: 0,
      };

      console.log('=== ✅ OCR Pipeline Complete ===');
      console.log('Extracted:', result);
      return result;

    } catch (error) {
      console.error('❌ OCR pipeline error:', error);
      return blank;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Convert ExtractedCard → Lead model
  // ─────────────────────────────────────────────────────────────────────────
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
        company:     Math.round(extracted.confidence.company * 20),
        email:       Math.round(extracted.confidence.email * 20),
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
    const weights = { name: 0.25, role: 0.2, company: 0.2, email: 0.15, phone: 0.1, location: 0.1 };
    const score =
      extracted.confidence.name     * weights.name +
      extracted.confidence.role     * weights.role +
      extracted.confidence.company  * weights.company +
      extracted.confidence.email    * weights.email +
      extracted.confidence.phone    * weights.phone +
      extracted.confidence.location * weights.location;
    return Math.round(score * 100);
  }

  private static getTimeAgo(date: Date): string {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1)  return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)   return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  private static getFollowUpDate(baseDate: Date): string {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

export default OCRService;
