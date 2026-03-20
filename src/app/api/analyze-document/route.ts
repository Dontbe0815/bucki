/**
 * API route for analyzing documents using AI.
 * Extracts structured data from property-related documents.
 * 
 * @module app/api/analyze-document/route
 */

import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';

/**
 * Rate limit configuration for this endpoint.
 * 10 requests per minute per IP.
 */
const RATE_LIMIT_CONFIG = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
};

/**
 * Gets the client IP address from the request.
 * Handles various proxy headers for accurate IP detection.
 */
function getClientIp(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback for development
  return '127.0.0.1';
}

/**
 * POST handler for document analysis.
 * Accepts a file and document type, returns extracted structured data.
 */
export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const clientIp = getClientIp(request);
  
  // Check rate limit
  const rateLimitResult = checkRateLimit(clientIp, RATE_LIMIT_CONFIG);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult, RATE_LIMIT_CONFIG);
  
  if (!rateLimitResult.success) {
    const response = NextResponse.json(
      { 
        error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.',
        retryAfter: rateLimitResult.retryAfter 
      },
      { status: 429 }
    );
    
    // Add rate limit headers
    rateLimitHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as string | null;
    
    if (!file) {
      const response = NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400 }
      );
      rateLimitHeaders.forEach((value, key) => response.headers.set(key, value));
      return response;
    }
    
    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      const response = NextResponse.json(
        { error: 'Datei ist zu groß. Maximum ist 10MB.' },
        { status: 400 }
      );
      rateLimitHeaders.forEach((value, key) => response.headers.set(key, value));
      return response;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      const response = NextResponse.json(
        { error: 'Ungültiger Dateityp. Erlaubt: PDF, JPEG, PNG.' },
        { status: 400 }
      );
      rateLimitHeaders.forEach((value, key) => response.headers.set(key, value));
      return response;
    }
    
    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    
    // Initialize AI SDK
    const zai = await ZAI.create();
    
    // Build extraction prompt based on document type
    const extractionPrompt = getExtractionPrompt(documentType || 'default');
    
    // Use VLM to analyze the document
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Du bist ein Experte für die Analyse von Immobilien-Dokumenten. 
          Extrahiere strukturierte Daten aus den Dokumenten und gib sie als valides JSON zurück.
          Wichtig: Gib NUR das JSON zurück, ohne Markdown-Formatierung oder zusätzliche Erklärungen.
          Falls ein Wert nicht erkannt wird, setze null ein.
          Schätze den confidence-Wert basierend auf der Qualität der erkannten Daten (0-100).`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: extractionPrompt },
            { 
              type: 'image_url', 
              image_url: { 
                url: `data:${file.type};base64,${base64}` 
              } 
            }
          ] as any
        }
      ],
    });
    
    const responseText = completion.choices[0]?.message?.content || '';
    
    // Try to parse the JSON response
    let extractedData;
    try {
      // Clean up potential markdown code blocks
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      extractedData = JSON.parse(cleanedResponse);
    } catch {
      extractedData = { 
        rawText: responseText,
        parseError: 'Konnte JSON nicht parsen',
        confidence: 0 
      };
    }
    
    const response = NextResponse.json({
      success: true,
      documentType,
      fileName: file.name,
      extractedData,
      rawResponse: responseText
    });
    
    // Add rate limit headers to successful response
    rateLimitHeaders.forEach((value, key) => response.headers.set(key, value));
    
    return response;
    
  } catch (error) {
    const response = NextResponse.json({ 
      error: 'Fehler bei der Dokumentenanalyse',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add rate limit headers even to error responses
    rateLimitHeaders.forEach((value, key) => response.headers.set(key, value));
    
    return response;
  }
}

/**
 * Returns the appropriate extraction prompt for the document type.
 */
function getExtractionPrompt(documentType: string): string {
  switch (documentType) {
    case 'purchase_contract':
      return `Analysiere diesen Kaufvertrag für eine Immobilie und extrahiere folgende Informationen als JSON:
      {
        "propertyType": "Wohnung/Haus/Gewerbe",
        "address": "Vollständige Adresse",
        "city": "Stadt",
        "postalCode": "PLZ",
        "purchasePrice": Zahl,
        "purchaseDate": "YYYY-MM-DD",
        "totalArea": Zahl in m²,
        "unitsCount": Anzahl der Einheiten,
        "yearBuilt": Baujahr,
        "landValue": Bodenwert,
        "buildingValue": Gebäudewert,
        "notaryCosts": Notarkosten,
        "agentFee": Maklercourtage,
        "transferTax": Grunderwerbsteuer,
        "seller": "Verkäufer Name",
        "buyer": "Käufer Name",
        "landRegistry": "Grundbuch Informationen",
        "encumbrances": ["Belastungen"],
        "specialConditions": ["Besondere Bedingungen"],
        "confidence": 0-100
      }`;
      
    case 'rental_contract':
      return `Analysiere diesen Mietvertrag und extrahiere folgende Informationen als JSON:
      {
        "tenantFirstName": "Vorname Mieter",
        "tenantLastName": "Nachname Mieter",
        "tenantEmail": "Email falls vorhanden",
        "tenantPhone": "Telefon falls vorhanden",
        "propertyAddress": "Adresse der Immobilie",
        "unitNumber": "Wohnungsnummer",
        "unitArea": Fläche in m²,
        "unitFloor": Etage,
        "rooms": Anzahl Zimmer,
        "baseRent": Kaltmiete pro Monat,
        "utilities": Nebenkosten pro Monat,
        "totalRent": Warmmiete pro Monat,
        "deposit": Kaution,
        "contractStartDate": "YYYY-MM-DD",
        "contractEndDate": "YYYY-MM-DD oder null",
        "noticePeriod": Kündigungsfrist,
        "landlord": "Vermieter Name",
        "specialConditions": ["Besondere Vereinbarungen"],
        "pets": "Haustiere erlaubt/verboten",
        "confidence": 0-100
      }`;
      
    case 'loan_contract':
      return `Analysiere diesen Kreditvertrag/Darlehensvertrag und extrahiere folgende Informationen als JSON:
      {
        "loanType": "Annuitätendarlehen/Tilgungsdarlehen/etc",
        "principalAmount": Kreditsumme,
        "interestRate": Zinssatz in Prozent,
        "repaymentRate": Tilgungssatz in Prozent,
        "monthlyRate": Monatliche Rate,
        "fixedRateYears": Zinsbindungsfrist in Jahren,
        "totalTermYears": Gesamlaufzeit in Jahren,
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD",
        "bankName": "Bank Name",
        "loanNumber": "Kreditnummer",
        "borrower": "Kreditnehmer",
        "collateral": ["Sicherheiten"],
        "specialConditions": ["Besondere Bedingungen"],
        "earlyRepaymentPenalty": "Vorfälligkeitsentschädigung Info",
        "confidence": 0-100
      }`;
      
    default:
      return `Analysiere dieses Dokument und extrahiere alle relevanten Immobilien-Daten als JSON. 
      Identifiziere den Dokumenttyp und extrahiere alle wichtigen Informationen.`;
  }
}
