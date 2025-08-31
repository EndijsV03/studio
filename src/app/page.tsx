'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import Image from 'next/image';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
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
import { UploadCloud, Search, Download, Loader2, Camera, X } from 'lucide-react';

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | Partial<Contact> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const fetchContacts = useCallback(async () => {
    setIsFetching(true);
    try {
      const contactsCollection = collection(db, 'contacts');
      const q = query(contactsCollection, orderBy('createdAt', 'desc'));
      const contactsSnapshot = await getDocs(q);
      const contactsList = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
      setContacts(contactsList);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch contacts from the database.",
      });
    }
    setIsFetching(false);
  }, [toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtract = async (dataUrl: string | null) => {
    if (!dataUrl) return;

    setIsLoading(true);
    const result = await extractContactInfoAction(dataUrl);
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
        imageUrl: dataUrl,
      });
      setIsFormOpen(true);
    }
  };
  
  const uploadImageAndGetURL = async (dataUrl: string, contactId: string): Promise<string> => {
    const storageRef = ref(storage, `contact-images/${contactId}`);
    await uploadString(storageRef, dataUrl, 'data_url');
    return getDownloadURL(storageRef);
  };


  const handleSaveContact = async (contactData: Contact | Partial<Contact>) => {
    setIsLoading(true);
    try {
      if ('id' in contactData && contactData.id) {
        // Update existing contact
        const contactDoc = doc(db, 'contacts', contactData.id);
        const { id, ...updateData } = contactData;
        await updateDoc(contactDoc, updateData);
        toast({ title: "Contact Updated", description: "Successfully updated the contact." });
      } else {
        // Add new contact
        const docRef = await addDoc(collection(db, 'contacts'), {
          ...contactData,
          imageUrl: '', // Start with empty image URL
          createdAt: serverTimestamp()
        });
        
        // Upload image if it's a data URL and then update the doc
        if (contactData.imageUrl && contactData.imageUrl.startsWith('data:')) {
            const finalImageUrl = await uploadImageAndGetURL(contactData.imageUrl, docRef.id);
            await updateDoc(docRef, { imageUrl: finalImageUrl });
        }
        
        toast({ title: "Contact Saved", description: "Successfully saved new contact." });
        clearPreview();
      }
      // This is the key change: ensure fetchContacts is awaited
      await fetchContacts(); 
    } catch(error) {
        console.error("Error saving contact:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save the contact.",
        });
    } finally {
      setIsLoading(false);
      setIsFormOpen(false);
      setEditingContact(null);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleDeleteContact = async (id: string, imageUrl?: string) => {
    try {
      await deleteDoc(doc(db, 'contacts', id));
      if (imageUrl) {
        // Only try to delete from storage if it's a gs:// or https:// URL
        if (imageUrl.startsWith('gs://') || imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef).catch(err => {
                if (err.code !== 'storage/object-not-found') {
                    console.error("Could not delete image from storage:", err);
                }
            });
        }
      }
      toast({ title: "Contact Deleted", description: "Successfully deleted the contact." });
      // This is the key change: ensure fetchContacts is awaited
      await fetchContacts();
    } catch(error) {
       console.error("Error deleting contact:", error);
       toast({
           variant: "destructive",
           title: "Error",
           description: "Could not delete the contact.",
       });
    }
  };
  
  const handleUpdateVoiceNote = async (id: string, voiceNoteUrl: string) => {
    try {
        const contactDoc = doc(db, 'contacts', id);
        await updateDoc(contactDoc, { voiceNoteUrl });
        await fetchContacts();
    } catch (error) {
        console.error("Error updating voice note:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not update voice note.",
        });
    }
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
  
  const clearPreview = () => {
    setPreviewUrl(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
    }
  }


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
                  <CardDescription>Upload or take a photo of a business card.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Business Card Photo</Label>
                     <div className="relative w-full h-48 border-2 border-dashed rounded-lg">
                      {previewUrl ? (
                        <>
                          <Image src={previewUrl} alt="Business card preview" layout="fill" objectFit="contain" className="rounded-lg" />
                           <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={clearPreview}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Clear image</span>
                          </Button>
                        </>
                      ) : (
                         <div className="flex flex-col justify-center items-center h-full text-center text-muted-foreground p-4">
                           <UploadCloud className="mx-auto h-10 w-10 mb-2" />
                           <p>Drag & drop or click to upload</p>
                         </div>
                      )}
                       <Input id="card-upload" ref={fileInputRef} type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                    </div>
                  </div>
                   <div className="flex gap-2">
                      <Button asChild variant="outline" className="w-full">
                          <Label htmlFor="camera-upload">
                            <Camera className="mr-2 h-4 w-4" />
                            Take Photo
                          </Label>
                      </Button>
                      <Input id="camera-upload" ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                    </div>
                  <Button onClick={() => handleExtract(previewUrl)} disabled={!previewUrl || isLoading} className="w-full">
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
                {isFetching ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredContacts.length > 0 ? (
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
                    <p className="text-sm text-muted-foreground">Upload or take a photo of a business card to get started.</p>
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
        isLoading={isLoading}
      />
    </>
  );
}
