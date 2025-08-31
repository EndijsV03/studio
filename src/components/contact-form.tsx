'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { Contact } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface ContactFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  contactData: Contact | Partial<Contact> | null;
  onSave: (contactData: Contact | Partial<Contact>) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function ContactForm({ isOpen, onOpenChange, contactData, onSave, onClose, isLoading = false }: ContactFormProps) {
  const [formData, setFormData] = useState<Partial<Contact>>({});

  useEffect(() => {
    if (contactData) {
      setFormData(contactData);
    }
  }, [contactData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      onClose();
    }
    onOpenChange(open);
  };

  if (!contactData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{'id' in contactData && contactData.id ? 'Edit Contact' : 'New Contact Details'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {formData.imageUrl && (
             <div className="relative w-full h-40">
                <Image src={formData.imageUrl} alt="Business card" layout="fill" objectFit="contain" className="rounded-md" data-ai-hint="business card"/>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fullName" className="text-right">Full Name</Label>
            <Input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="jobTitle" className="text-right">Job Title</Label>
            <Input id="jobTitle" name="jobTitle" value={formData.jobTitle || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="companyName" className="text-right">Company</Label>
            <Input id="companyName" name="companyName" value={formData.companyName || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phoneNumber" className="text-right">Phone</Label>
            <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="emailAddress" className="text-right">Email</Label>
            <Input id="emailAddress" name="emailAddress" value={formData.emailAddress || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="physicalAddress" className="text-right pt-2">Address</Label>
            <Textarea id="physicalAddress" name="physicalAddress" value={formData.physicalAddress || ''} onChange={handleChange} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isLoading}>Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Contact
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
