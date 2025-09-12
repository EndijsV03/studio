
import type { Timestamp } from "firebase/firestore";

export interface Contact {
  id: string;
  userId?: string; 
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

export type SubscriptionPlan = 'free' | 'pro' | 'business';

export interface UserProfile {
    id: string;
    email: string;
    subscriptionPlan: SubscriptionPlan;
    contactCount: number;
    createdAt: Timestamp;
    stripeCustomerId?: string;
}
