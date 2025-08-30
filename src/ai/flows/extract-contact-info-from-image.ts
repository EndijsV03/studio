'use server';
/**
 * @fileOverview Extracts contact information from an image of a business card using AI.
 *
 * - extractContactInfo - A function that handles the contact information extraction process.
 * - ExtractContactInfoInput - The input type for the extractContactInfo function.
 * - ExtractContactInfoOutput - The return type for the extractContactInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

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

export async function extractContactInfo(input: ExtractContactInfoInput): Promise<ExtractContactInfoOutput> {
  return extractContactInfoFlow(input);
}

const extractContactInfoFlow = ai.defineFlow(
  {
    name: 'extractContactInfoFlow',
    inputSchema: ExtractContactInfoInputSchema,
    outputSchema: ExtractContactInfoOutputSchema,
  },
  async (input) => {
    const visionModel = googleAI.model('gemini-1.5-flash-latest');
    const { output } = await ai.generate({
      model: visionModel,
      prompt: `
        You are an AI assistant that extracts contact information from business card images.

        Given a business card image, extract the following information:
        - Full Name
        - Job Title
        - Company Name
        - Phone Number
        - Email Address
        - Physical Address

        Here is the business card image:
        ${JSON.stringify({ media: { url: input.photoDataUri } })}

        Return the extracted information in JSON format.
      `,
      output: {
        schema: ExtractContactInfoOutputSchema,
      },
    });
    return output!;
  }
);
