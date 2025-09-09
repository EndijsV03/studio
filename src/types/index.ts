import type { Timestamp } from "firebase/firestore";

export interface Contact {
  id: string;
  userId?: string; // Add userId to the contact type
  fullName?: string;
  jobTitle?: string;
  companyName?: 'string';
  phoneNumber?: string;
  emailAddress?: string;
  physicalAddress?: string;
  voiceNoteUrl?: string;
  imageUrl?: string;
  createdAt?: Timestamp;
}
