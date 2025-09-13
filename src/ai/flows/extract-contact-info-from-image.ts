'use server';
/**
 * @fileOverview Extracts contact information from an image of a business card using a multimodal Genkit flow.
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
 * Extracts contact information from a business card image using a multimodal Genkit flow.
 * @param input The input containing the base64 encoded image data URI.
 * @returns The extracted contact information.
 */
export async function extractContactInfo(input: ExtractContactInfoInput): Promise<ExtractContactInfoOutput> {
  return extractContactInfoFlow(input);
}

const extractContactInfoPrompt = ai.definePrompt({
  name: 'extractContactInfoPrompt',
  input: { schema: ExtractContactInfoInputSchema },
  output: { schema: ExtractContactInfoOutputSchema },
  prompt: `You are an expert at parsing contact information from an image of a business card. 
  
  Your task is to identify and extract the following fields from the provided image:
  - Full Name (fullName)
  - Job Title (jobTitle)
  - Company Name (companyName)
  - Phone Number (phoneNumber)
  - Email Address (emailAddress)
  - Physical Address (physicalAddress)

  Here is the business card image:
  {{media url=photoDataUri}}
  `,
});

const extractContactInfoFlow = ai.defineFlow(
  {
    name: 'extractContactInfoFlow',
    inputSchema: ExtractContactInfoInputSchema,
    outputSchema: ExtractContactInfoOutputSchema,
  },
  async (input) => {
    const { output } = await extractContactInfoPrompt(input);
    return output!;
  }
);
