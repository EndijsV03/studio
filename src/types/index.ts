import type { Timestamp } from "firebase/firestore";

export interface Contact {
  id: string;
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
