'use client';

import Image from 'next/image';
import type { Contact } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { VoiceRecorder } from '@/components/voice-recorder';
import { User, Briefcase, Building, Phone, Mail, MapPin, Trash2, Pencil } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onUpdateVoiceNote: (id: string, url: string) => void;
}

export function ContactCard({ contact, onEdit, onDelete, onUpdateVoiceNote }: ContactCardProps) {
  const contactInfo = [
    { icon: User, label: 'Full Name', value: contact.fullName },
    { icon: Briefcase, label: 'Job Title', value: contact.jobTitle },
    { icon: Building, label: 'Company', value: contact.companyName },
    { icon: Phone, label: 'Phone', value: contact.phoneNumber, href: `tel:${contact.phoneNumber}` },
    { icon: Mail, label: 'Email', value: contact.emailAddress, href: `mailto:${contact.emailAddress}` },
    { icon: MapPin, label: 'Address', value: contact.physicalAddress },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start gap-4">
          {contact.imageUrl && (
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
              <Image src={contact.imageUrl} alt={contact.fullName || 'Business card'} className="rounded-md object-cover" layout="fill" data-ai-hint="business card" />
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-xl">{contact.fullName || 'No Name'}</CardTitle>
            <CardDescription>{contact.jobTitle || 'No Title'}</CardDescription>
            <p className="text-sm text-muted-foreground">{contact.companyName}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {contactInfo.filter(info => info.value && !['Full Name', 'Job Title', 'Company'].includes(info.label)).map((info, index) => (
          <div key={index} className="flex items-start gap-3">
            <info.icon className="w-4 h-4 mt-1 text-muted-foreground shrink-0" />
            <div className="text-sm">
              {info.href ? (
                 <a href={info.href} className="hover:underline text-primary" target="_blank" rel="noopener noreferrer">
                  {info.value}
                </a>
              ) : (
                <span>{info.value}</span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
      <Separator className="my-2" />
      <CardFooter className="flex flex-col items-start gap-4 p-4">
         <VoiceRecorder 
          voiceNoteUrl={contact.voiceNoteUrl}
          onSave={(url) => onUpdateVoiceNote(contact.id, url)}
        />
        <div className="flex w-full justify-end gap-2">
           <Button variant="ghost" size="icon" onClick={() => onEdit(contact)}>
            <Pencil className="w-4 h-4" />
            <span className="sr-only">Edit Contact</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(contact.id)}>
            <Trash2 className="w-4 h-4" />
            <span className="sr-only">Delete Contact</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
