'use server';

import { extractContactInfo } from '@/ai/flows/extract-contact-info-from-image';
import type { Contact } from '@/types';

export async function extractContactInfoAction(
  photoDataUri: string
): Promise<{ contactInfo: Partial<Contact> } | { error: string }> {
  try {
    const result = await extractContactInfo({ photoDataUri });
    return { contactInfo: result.contactInfo };
  } catch (e) {
    console.error(e);
    // This is a more user-friendly error message.
    if (e instanceof Error && e.message.includes('media')) {
      return { error: 'Failed to process image. The file may be corrupt or in an unsupported format.' };
    }
    return { error: 'An unexpected error occurred while extracting information. Please try again.' };
  }
}
