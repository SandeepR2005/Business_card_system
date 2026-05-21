import { Lead } from '../types';
import { CURRENT_USER } from './data';
import LeadtoolsOCRService, { LeadtoolsCardResult } from './leadtools-ocr';

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
  /**
   * Additional metadata from LEADTOOLS
   */
  cardQuality?: number;
  cardDetected?: boolean;
  cardOrientation?: number;
}

/**
 * OCR Service — Extracts business card data from real captured images.
 *
 * Uses LEADTOOLS Business Card Recognition Engine (on-device)
 *   • Fully on-device processing — no cloud calls, better privacy
 *   • Structured field extraction with per-field confidence
 *   • Card detection and orientation correction
 *   • Works with captured camera frames directly
 *
 * Architecture:
 *   1. Image captured via expo-camera
 *   2. Passed to LEADTOOLS for card detection & field extraction
 *   3. Structured data returned with confidence scores
 *   4. Lead model created from extraction
 *   5. User reviews and can edit in FieldReview screen
 *   6. Saved to local storage
 */

// Initialize LEADTOOLS on service load
LeadtoolsOCRService.initialize().catch(err =>
  console.error('⚠️ Failed to initialize LEADTOOLS:', err),
);

export class OCRService {
  /**
   * Analyze image and extract business card data using LEADTOOLS
   *
   * This is the on-device processing method that:
   * 1. Detects card presence and orientation
   * 2. Extracts structured fields with confidence scores
   * 3. Returns both structured data and raw text for reference
   *
   * @param base64Image - Raw base64 string from expo-camera (no data URI prefix)
   */
  private static async analyzeWithLeadtools(base64Image: string): Promise<{
    rawText: string;
    leadtoolsResult: LeadtoolsCardResult;
  }> {
    if (!base64Image || base64Image.length === 0) {
      throw new Error('No image data provided to OCR service');
    }

    const sizeKB = Math.round(base64Image.length / 1024);
    console.log(`📊 Image base64 size: ${sizeKB} KB`);

    try {
      console.log('🚀 Starting LEADTOOLS on-device card recognition…');

      // Call LEADTOOLS Business Card Recognition Engine
      const leadtoolsResult = await LeadtoolsOCRService.recognizeCard(base64Image);

      if (!leadtoolsResult.cardDetected) {
        console.warn('⚠️ LEADTOOLS: No business card detected in image');
        return {
          rawText: '',
          leadtoolsResult,
        };
      }

      console.log('✅ LEADTOOLS: Card detected', {
        quality: leadtoolsResult.cardQuality,
        orientation: leadtoolsResult.cardOrientation,
        fieldsExtracted: Object.keys(leadtoolsResult.fields).length,
      });

      // Reconstruct raw text from structured fields for reference
      const rawText = this.reconstructTextFromFields(leadtoolsResult.fields);

      return {
        rawText,
        leadtoolsResult,
      };
    } catch (error) {
      console.error('❌ LEADTOOLS analysis failed:', error);
      throw error;
    }
  }

  /**
   * Reconstruct readable text from structured LEADTOOLS fields
   * Used for display and debugging purposes
   */
  private static reconstructTextFromFields(
    fields: LeadtoolsCardResult['fields'],
  ): string {
    const lines: string[] = [];

    if (fields.name?.value) lines.push(fields.name.value);
    if (fields.title?.value) lines.push(fields.title.value);
    if (fields.company?.value) lines.push(fields.company.value);
    if (fields.email?.value) lines.push(fields.email.value);
    if (fields.phone?.value) lines.push(fields.phone.value);
    if (fields.website?.value) lines.push(fields.website.value);
    if (fields.address?.value) lines.push(fields.address.value);
    if (fields.city?.value) lines.push(fields.city.value);
    if (fields.state?.value) lines.push(fields.state.value);
    if (fields.zipcode?.value) lines.push(fields.zipcode.value);
    if (fields.country?.value) lines.push(fields.country.value);

    return lines.join('\n');
  }

  /**
   * Main OCR entry point using LEADTOOLS
   *
   * Accepts base64 string directly from expo-camera's takePictureAsync
   * Returns ExtractedCard with structured fields and confidence scores
   *
   * @param base64Image - Raw base64 string from photo.base64 (no data URI prefix)
   */
  static async analyzeImageAndExtractText(base64Image: string): Promise<{
    rawText: string;
    leadtoolsResult: LeadtoolsCardResult;
  }> {
    console.log('=== 📸 OCR: analyzeImageAndExtractText (LEADTOOLS) ===');
    console.log('Base64 length:', base64Image?.length ?? 0);

    if (!base64Image || base64Image.trim().length === 0) {
      console.warn('⚠️ No base64 image data — returning empty result.');
      return {
        rawText: '',
        leadtoolsResult: {
          cardImage: '',
          cardDetected: false,
          cardOrientation: 0,
          fields: {},
          cardQuality: 0,
          metadata: {
            processingTime: 0,
            imageWidth: 0,
            imageHeight: 0,
          },
        },
      };
    }

    try {
      return await this.analyzeWithLeadtools(base64Image);
    } catch (err) {
      console.error('❌ LEADTOOLS analysis failed:', err);
      return {
        rawText: '',
        leadtoolsResult: {
          cardImage: '',
          cardDetected: false,
          cardOrientation: 0,
          fields: {},
          cardQuality: 0,
          metadata: {
            processingTime: 0,
            imageWidth: 0,
            imageHeight: 0,
          },
        },
      };
    }
  }

  /**
   * Map LEADTOOLS structured fields to ExtractedCard format
   *
   * Normalizes field names and confidence scores
   * Handles missing fields gracefully
   */
  private static mapLeadtoolsToExtractedCard(
    leadtoolsResult: LeadtoolsCardResult,
  ): Partial<ExtractedCard> {
    const fields = leadtoolsResult.fields;

    return {
      name: fields.name?.value || '',
      role: fields.title?.value || '',
      company: fields.company?.value || '',
      email: fields.email?.value || '',
      phone: fields.phone?.value || '',
      location:
        [fields.city?.value, fields.state?.value, fields.country?.value]
          .filter(Boolean)
          .join(', ') || '',
      confidence: {
        name: fields.name?.confidence ?? 0,
        role: fields.title?.confidence ?? 0,
        company: fields.company?.confidence ?? 0,
        email: fields.email?.confidence ?? 0,
        phone: fields.phone?.confidence ?? 0,
        location: Math.max(
          fields.city?.confidence ?? 0,
          fields.state?.confidence ?? 0,
          fields.country?.confidence ?? 0,
        ),
      },
      rawText: this.reconstructTextFromFields(fields),
      cardQuality: leadtoolsResult.cardQuality,
      cardDetected: leadtoolsResult.cardDetected,
      cardOrientation: leadtoolsResult.cardOrientation,
    };
  }

  /**
   * Parse business card text using heuristic fallback
   *
   * Called only if LEADTOOLS didn't extract structured data.
   * Provides a fallback parsing method using regex and keywords.
   */
  private static parseBusinessCardTextFallback(text: string): Partial<ExtractedCard> {
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

    // Extract email (highest confidence)
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(emailRe);
      if (m) {
        extracted.email = m[0].toLowerCase();
        extracted.confidence!.email = 0.98;
        claimed.add(i);
        break;
      }
    }

    // Extract phone
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

    // Extract role
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

    // Extract company
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

    // Extract location
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

    // Skip website lines
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

    // First unclaimed line with capital letter = name
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

    // If company still missing, use second unclaimed line
    if (!extracted.company) {
      let count = 0;
      for (let i = 0; i < lines.length; i++) {
        if (claimed.has(i)) continue;
        count++;
        if (count === 1) {
          extracted.company = lines[i];
          companyConfidence = 0.55;
          extracted.confidence!.company = companyConfidence;
          claimed.add(i);
          break;
        }
      }
    }

    // Set confidence summaries
    if (extracted.confidence) {
      if (!extracted.confidence.name) extracted.confidence.name = nameConfidence;
      if (!extracted.confidence.role) extracted.confidence.role = roleConfidence;
      if (!extracted.confidence.company) extracted.confidence.company = companyConfidence;
      if (!extracted.confidence.location) extracted.confidence.location = locationConfidence;
    }

    return extracted;
  }
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
   * Full OCR pipeline: base64 image → LEADTOOLS → structured fields → ExtractedCard
   *
   * Pipeline steps:
   * 1. Card detection: Verify a business card is present
   * 2. Orientation correction: Detect and rotate if needed
   * 3. Field extraction: Extract structured data with confidence scores
   * 4. Mapping: Convert LEADTOOLS results to ExtractedCard format
   * 5. Fallback: Use regex parsing if LEADTOOLS extraction is incomplete
   *
   * @param base64Image - Raw base64 string from expo-camera photo.base64
   */
  static async extractCard(base64Image: string): Promise<ExtractedCard> {
    try {
      console.log('=== 🚀 OCR Pipeline Start (LEADTOOLS) ===');

      // Step 1: Analyze image using LEADTOOLS
      const { rawText, leadtoolsResult } = await this.analyzeImageAndExtractText(base64Image);

      // Step 2: Map LEADTOOLS results to ExtractedCard
      const fromLeadtools = this.mapLeadtoolsToExtractedCard(leadtoolsResult);

      // Step 3: If LEADTOOLS didn't extract key fields, use fallback parsing
      let extracted: Partial<ExtractedCard> = fromLeadtools;

      const hasMinimalData =
        fromLeadtools.name ||
        fromLeadtools.email ||
        fromLeadtools.phone ||
        fromLeadtools.company;

      if (!hasMinimalData && rawText.trim().length > 0) {
        console.log('💡 LEADTOOLS extraction incomplete, using fallback parsing…');
        extracted = this.parseBusinessCardTextFallback(rawText);
      }

      console.log('=== ✅ OCR Pipeline Complete ===');
      console.log('Extracted result:', extracted);

      return extracted as ExtractedCard;
    } catch (error) {
      console.error('❌ OCR pipeline error:', error);
      // Return blank card so user can type manually
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
