'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import type { Contact } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, StopCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [isRecording, setIsRecording] = useState(false);
  const [localAudio, setLocalAudio] = useState<{ url: string; blob: Blob } | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (contactData) {
      setFormData(contactData);
      // Reset local audio state when a new contact is loaded into the form
      setLocalAudio(null);
    }
  }, [contactData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const dataToSave = { ...formData };
    // If there's a new local recording, we'll handle it in the parent `handleSaveContact` function
    if (localAudio) {
      // A bit of a hack: we pass the blob through the imageUrl field as it's not used for audio
      // This is because we need to pass the blob data to the parent save function.
      // We will replace it with a proper URL after upload.
      (dataToSave as any).audioBlob = localAudio.blob;
    }
    onSave(dataToSave);
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      onClose();
      // Clean up recording state if dialog is closed
      if (isRecording) {
        stopRecording(false); // Stop without saving
      }
      setLocalAudio(null);
    }
    onOpenChange(open);
  };

  const startRecording = async () => {
    // Clear previous recordings
    setLocalAudio(null);
    setFormData(prev => ({...prev, voiceNoteUrl: undefined}));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setLocalAudio({ url: audioUrl, blob: audioBlob });
        audioChunks.current = [];
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
      });
    }
  };

  const stopRecording = (shouldSave = true) => {
    if (mediaRecorder.current) {
      if (shouldSave) {
        mediaRecorder.current.stop();
      } else {
        // Stop streams without triggering onstop save logic
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
        mediaRecorder.current = null;
        audioChunks.current = [];
      }
      setIsRecording(false);
    }
  };

  const handleDeleteAudio = () => {
    setLocalAudio(null);
    setFormData(prev => ({...prev, voiceNoteUrl: undefined}));
  }

  const currentAudioUrl = localAudio?.url || formData.voiceNoteUrl;

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
          <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Voice Note</Label>
              <div className="col-span-3 flex items-center gap-2">
                {!isRecording && !currentAudioUrl && (
                  <Button variant="outline" onClick={startRecording} type="button">
                    <Mic className="mr-2 h-4 w-4" /> Record
                  </Button>
                )}
                {isRecording && (
                  <Button variant="destructive" onClick={() => stopRecording(true)} type="button">
                    <StopCircle className="mr-2 h-4 w-4 animate-pulse" /> Stop
                  </Button>
                )}
                {currentAudioUrl && !isRecording && (
                  <>
                    <audio src={currentAudioUrl} controls className="w-full h-10" />
                     <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleDeleteAudio} type="button">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
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
