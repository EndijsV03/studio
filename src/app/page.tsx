'use client';

import { useState, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ContactCard } from '@/components/contact-card';
import { ContactForm } from '@/components/contact-form';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { extractContactInfoAction } from '@/app/actions';
import type { Contact } from '@/types';
import { UploadCloud, Search, Download, Loader2 } from 'lucide-react';

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | Partial<Contact> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtract = async () => {
    if (!fileToUpload || !previewUrl) return;

    setIsLoading(true);
    const result = await extractContactInfoAction(previewUrl);
    setIsLoading(false);

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: 'Extraction Failed',
        description: result.error,
      });
    } else {
      setEditingContact({
        ...result.contactInfo,
        imageUrl: previewUrl,
      });
      setIsFormOpen(true);
    }
  };

  const handleSaveContact = (contactData: Contact | Partial<Contact>) => {
    if ('id' in contactData && contactData.id) {
      // Update existing contact
      setContacts(contacts.map((c) => (c.id === contactData.id ? (contactData as Contact) : c)));
    } else {
      // Add new contact
      const newContact: Contact = {
        id: new Date().toISOString(),
        ...contactData,
      };
      setContacts([newContact, ...contacts]);
      // Reset uploader
      setFileToUpload(null);
      setPreviewUrl(null);
    }
    setIsFormOpen(false);
    setEditingContact(null);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };
  
  const handleUpdateVoiceNote = (id: string, voiceNoteUrl: string) => {
    setContacts(contacts.map((c) => (c.id === id ? { ...c, voiceNoteUrl } : c)));
  };

  const handleExportCsv = () => {
    const headers = 'fullName,jobTitle,companyName,phoneNumber,emailAddress,physicalAddress\n';
    const rows = contacts.map(c => 
      [c.fullName, c.jobTitle, c.companyName, c.phoneNumber, c.emailAddress, c.physicalAddress]
      .map(field => `"${(field || '').replace(/"/g, '""')}"`)
      .join(',')
    ).join('\n');
    
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'CardSync_Pro_Contacts.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const search = searchTerm.toLowerCase();
      return (
        contact.fullName?.toLowerCase().includes(search) ||
        contact.companyName?.toLowerCase().includes(search) ||
        contact.jobTitle?.toLowerCase().includes(search)
      );
    });
  }, [contacts, searchTerm]);


  return (
    <>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <Icons.logo className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold">CardSync Pro</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Capture Card</CardTitle>
                  <CardDescription>Upload a business card to extract contact info.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-upload">Business Card Photo</Label>
                    <div className="relative flex justify-center items-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <Input id="card-upload" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                      {previewUrl ? (
                        <Image src={previewUrl} alt="Business card preview" layout="fill" objectFit="contain" className="rounded-lg" />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <UploadCloud className="mx-auto h-10 w-10 mb-2" />
                          <p>Click to upload or drag & drop</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button onClick={handleExtract} disabled={!fileToUpload || isLoading} className="w-full">
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                    {isLoading ? 'Extracting...' : 'Extract Information'}
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-8">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <h2 className="text-2xl font-bold tracking-tight">My Contacts ({filteredContacts.length})</h2>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search contacts..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <Button variant="outline" onClick={handleExportCsv} disabled={contacts.length === 0}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
                {filteredContacts.length > 0 ? (
                   <div className="grid gap-6 md:grid-cols-2">
                    {filteredContacts.map(contact => (
                      <ContactCard 
                        key={contact.id} 
                        contact={contact} 
                        onEdit={handleEditContact}
                        onDelete={handleDeleteContact}
                        onUpdateVoiceNote={handleUpdateVoiceNote}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No contacts found.</p>
                    <p className="text-sm text-muted-foreground">Upload a business card to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <ContactForm 
        isOpen={isFormOpen} 
        onOpenChange={setIsFormOpen}
        contactData={editingContact}
        onSave={handleSaveContact}
        onClose={() => setEditingContact(null)}
      />
    </>
  );
}
