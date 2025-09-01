'use server';
/**
 * @fileOverview Extracts contact information from an image of a business card using Google Cloud Vision API and a Genkit flow.
 *
 * - extractContactInfo - A function that handles the contact information extraction process.
 * - ExtractContactInfoInput - The input type for the extractContactInfo function.
 * - ExtractContactInfoOutput - The return type for the extractContactInfo function.
 */

import {z} from 'genkit';
import { ai } from '@/ai/genkit';

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
 * Extracts contact information from a business card image using Google Cloud Vision API and a Genkit flow.
 * @param input The input containing the base64 encoded image data URI.
 * @returns The extracted contact information.
 */
export async function extractContactInfo(input: ExtractContactInfoInput): Promise<ExtractContactInfoOutput> {
  return extractContactInfoFlow(input);
}

const structureContactInfoPrompt = ai.definePrompt({
  name: 'structureContactInfoPrompt',
  input: { schema: z.object({ text: z.string() }) },
  output: { schema: ExtractContactInfoOutputSchema },
  prompt: `You are an expert at parsing contact information from unstructured text extracted from a business card. 
  
  Your task is to identify and extract the following fields:
  - Full Name (fullName)
  - Job Title (jobTitle)
  - Company Name (companyName)
  - Phone Number (phoneNumber)
  - Email Address (emailAddress)
  - Physical Address (physicalAddress)

  Here is the text from the business card:
  
  {{{text}}}
  `,
});

const extractContactInfoFlow = ai.defineFlow(
  {
    name: 'extractContactInfoFlow',
    inputSchema: ExtractContactInfoInputSchema,
    outputSchema: ExtractContactInfoOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key is not configured.');
    }

    // 1. Extract raw text using Google Cloud Vision API
    const base64Image = input.photoDataUri.split(',')[1];
    const visionRequestBody = {
      requests: [
        {
          image: { content: base64Image },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        },
      ],
    };

    const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visionRequestBody),
    });

    if (!visionResponse.ok) {
      const errorBody = await visionResponse.json();
      console.error('Cloud Vision API Error:', errorBody);
      throw new Error(`Cloud Vision API request failed with status ${visionResponse.status}: ${errorBody.error?.message || 'Unknown error'}`);
    }

    const visionResult = await visionResponse.json();
    const detection = visionResult.responses?.[0];
    const fullText = detection?.fullTextAnnotation?.text;

    if (!fullText) {
      return { contactInfo: {} }; // Return empty if no text is found
    }

    // 2. Use a generative model to structure the extracted text
    const { output } = await structureContactInfoPrompt({ text: fullText });
    return output!;
  }
);
