'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
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
import { UploadCloud, Search, Download, Loader2, Camera, X, ChevronDown, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import * as XLSX from 'xlsx';
import Link from 'next/link';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | Partial<Contact> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthLoading(false);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);
  
  const fetchContacts = useCallback(async () => {
    if (!currentUser) return;
    // Don't set fetching to true if it's a refresh
    if (contacts.length === 0) {
      setIsFetching(true);
    }
    try {
      const contactsCollection = collection(db, 'contacts');
      // Query for contacts belonging to the current user
      const q = query(
        contactsCollection, 
        where('userId', '==', currentUser.uid), 
        orderBy('createdAt', 'desc')
      );
      const contactsSnapshot = await getDocs(q);
      const contactsList = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
      setContacts(contactsList);
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
      // Firestore will suggest creating an index if one doesn't exist.
      if (error.code === 'failed-precondition') {
          toast({
            variant: "destructive",
            title: "Database Index Required",
            description: "Please create the required Firestore index to query contacts. Check the console for a link.",
          });
          // Log the full error which contains the link to create the index
          console.error(error);
      } else {
         toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch contacts from the database.",
        });
      }
    }
    setIsFetching(false);
  }, [toast, contacts.length, currentUser]);

  useEffect(() => {
    if (!isAuthLoading && currentUser) {
        fetchContacts();
    }
  }, [isAuthLoading, currentUser, fetchContacts]);
  
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
    setSaveStatus('saving');
    const result = await extractContactInfoAction(dataUrl);
    setSaveStatus('idle');

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
    if (!currentUser) throw new Error("User not authenticated for image upload.");
    const storageRef = ref(storage, `contact-images/${currentUser.uid}/${contactId}`);
    await uploadString(storageRef, dataUrl, 'data_url');
    return getDownloadURL(storageRef);
  };
  
  const uploadVoiceNoteAndGetURL = async (audioBlob: Blob, contactId: string): Promise<string> => {
     if (!currentUser) throw new Error("User not authenticated for voice note upload.");
    const storageRef = ref(storage, `voice-notes/${currentUser.uid}/${contactId}.wav`);
    await uploadBytes(storageRef, audioBlob);
    return getDownloadURL(storageRef);
  };


  const handleSaveContact = async (contactData: Contact | Partial<Contact>) => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to save a contact.' });
      return;
    }

    setSaveStatus('saving');
    try {
      const { audioBlob, ...restOfContactData } = contactData as any;

      if ('id' in restOfContactData && restOfContactData.id) {
        // --- UPDATE EXISTING CONTACT ---
        const contactDoc = doc(db, 'contacts', restOfContactData.id);
        const { id, ...updateData } = restOfContactData;
        
        let voiceNoteUrl = updateData.voiceNoteUrl;
        if(audioBlob) {
            voiceNoteUrl = await uploadVoiceNoteAndGetURL(audioBlob, id);
        }

        await updateDoc(contactDoc, {...updateData, voiceNoteUrl});

      } else {
        // --- ADD NEW CONTACT ---
        const docRef = await addDoc(collection(db, 'contacts'), {
          ...restOfContactData,
          userId: currentUser.uid, // Add the user's ID
          imageUrl: '', // Start with empty image URL
          voiceNoteUrl: '', // Start with empty voice note URL
          createdAt: serverTimestamp()
        });
        
        let finalImageUrl = '';
        let finalVoiceNoteUrl = '';

        // Upload image if it's a data URL
        if (restOfContactData.imageUrl && restOfContactData.imageUrl.startsWith('data:')) {
            finalImageUrl = await uploadImageAndGetURL(restOfContactData.imageUrl, docRef.id);
        }

        // Upload voice note if a blob was passed
        if (audioBlob) {
            finalVoiceNoteUrl = await uploadVoiceNoteAndGetURL(audioBlob, docRef.id);
        }

        // Final update with all URLs
        await updateDoc(docRef, { 
          imageUrl: finalImageUrl,
          voiceNoteUrl: finalVoiceNoteUrl
        });
      }
      
      toast({
        title: 'Contact Saved',
        description: 'Successfully saved the contact.',
      });
      await fetchContacts(); 
      setIsFormOpen(false);
      setEditingContact(null);
      clearPreview();

    } catch(error) {
        console.error("Error saving contact:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not save the contact.',
        });
    } finally {
        setSaveStatus('idle');
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleDeleteContact = async (id: string, imageUrl?: string) => {
    try {
      await deleteDoc(doc(db, 'contacts', id));
      if (imageUrl && currentUser) {
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

  const handleExportXlsx = () => {
    const worksheet = XLSX.utils.json_to_sheet(contacts.map(c => ({
      'Full Name': c.fullName,
      'Job Title': c.jobTitle,
      'Company Name': c.companyName,
      'Phone Number': c.phoneNumber,
      'Email Address': c.emailAddress,
      'Physical Address': c.physicalAddress,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
    XLSX.writeFile(workbook, 'CardSync_Pro_Contacts.xlsx');
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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sign Out Failed',
        description: 'An error occurred while signing out.',
      });
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <Icons.logo className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold">CardSync Pro</h1>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
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
                  <Button onClick={() => handleExtract(previewUrl)} disabled={!previewUrl || saveStatus === 'saving'} className="w-full">
                    {saveStatus === 'saving' && !isFormOpen ? <Loader2 className="animate-spin mr-2" /> : null}
                    {saveStatus === 'saving' && !isFormOpen ? 'Extracting...' : 'Extract Information'}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={contacts.length === 0}>
                          <Download className="mr-2 h-4 w-4" />
                          Export
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleExportCsv}>
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportXlsx}>
                          Export as XLSX
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
        isLoading={saveStatus === 'saving'}
      />
    </>
  );
}
