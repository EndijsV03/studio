'use server';
/**
 * @fileOverview Extracts contact information from an image of a business card using the Google Cloud Vision API.
 *
 * - extractContactInfo - A function that handles the contact information extraction process.
 * - ExtractContactInfoInput - The input type for the extractContactInfo function.
 * - ExtractContactInfoOutput - The return type for the extractContactInfo function.
 */

import {z} from 'genkit';

const ExtractContactInfoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a business card, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractContactInfoInput = z.infer<typeof ExtractContactInfoInputSchema>;

const ExtractContactInfoOutputSchema = z.object({
  contactInfo: z.object({
    fullName: z.string().describe('The full name of the contact.').optional(),
    jobTitle: z.string().describe('The job title of the contact.').optional(),
    companyName: z.string().describe('The company name of the contact.').optional(),
    phoneNumber: z.string().describe('The phone number of the contact.').optional(),
    emailAddress: z.string().describe('The email address of the contact.').optional(),
    physicalAddress: z.string().describe('The physical address of the contact.').optional(),
  }).describe('Extracted contact information from the business card image.'),
});
export type ExtractContactInfoOutput = z.infer<typeof ExtractContactInfoOutputSchema>;


/**
 * Extracts contact information from a business card image using Google Cloud Vision API.
 * @param input The input containing the base64 encoded image data URI.
 * @returns The extracted contact information.
 */
export async function extractContactInfo(input: ExtractContactInfoInput): Promise<ExtractContactInfoOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Google API key is not configured.');
  }

  // Extract the base64 content from the data URI
  const base64Image = input.photoDataUri.split(',')[1];

  const requestBody = {
    requests: [
      {
        image: {
          content: base64Image,
        },
        features: [
          {
            type: 'TEXT_DETECTION',
          },
        ],
      },
    ],
  };

  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    console.error('Cloud Vision API Error:', errorBody);
    throw new Error(`Cloud Vision API request failed with status ${response.status}: ${errorBody.error?.message || 'Unknown error'}`);
  }

  const result = await response.json();
  const detection = result.responses?.[0];

  if (!detection || !detection.fullTextAnnotation) {
    return { contactInfo: {} }; // Return empty if no text is found
  }

  const fullText = detection.fullTextAnnotation.text;
  
  // This is a simplified parser. A more robust solution might use another LLM call to structure the data.
  const contactInfo = parseContactInfo(fullText);

  return { contactInfo };
}


function parseContactInfo(text: string): Partial<ExtractContactInfoOutput['contactInfo']> {
    const contact: Partial<ExtractContactInfoOutput['contactInfo']> = {};
    const lines = text.split('\n');

    // Regex patterns for common fields
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    
    // Naive assumption: First line is often the name or company
    if (lines.length > 0) {
      contact.fullName = lines[0]; 
    }
    if (lines.length > 1) {
       // Look for a job title in the first few lines
       const possibleTitle = lines.slice(1, 3).find(l => !emailRegex.test(l) && !phoneRegex.test(l) && l.length < 50);
       if(possibleTitle && lines[0].length < 50) {
         contact.jobTitle = possibleTitle;
       } else {
         contact.companyName = lines[1];
       }
    }

    lines.forEach(line => {
        const emailMatch = line.match(emailRegex);
        if (emailMatch) {
            contact.emailAddress = emailMatch[0];
        }

        const phoneMatch = line.match(phoneRegex);
        if (phoneMatch) {
            contact.phoneNumber = phoneMatch[0];
        }
    });

    // A simple heuristic for address: look for multiple lines with numbers and street names.
    const addressLines = lines.filter(line => /\d/.test(line) && /[a-zA-Z]/.test(line) && line.length > 10 && !phoneRegex.test(line) && !emailRegex.test(line));
    if (addressLines.length > 0) {
      contact.physicalAddress = addressLines.join(', ');
    }

    return contact;
}
