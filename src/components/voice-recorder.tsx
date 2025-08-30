'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Play, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  voiceNoteUrl?: string;
  onSave: (url: string) => void;
}

export function VoiceRecorder({ voiceNoteUrl, onSave }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(voiceNoteUrl);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setAudioURL(voiceNoteUrl);
  }, [voiceNoteUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        onSave(url);
        audioChunks.current = [];
        // Stop all tracks to turn off mic indicator
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast({
        variant: 'destructive',
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check your browser permissions.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };
  
  const handleDelete = () => {
    setAudioURL(undefined);
    onSave(''); // Pass empty string to signify deletion
  }

  return (
    <div className="w-full">
      <Label className="text-sm font-medium">Voice Note</Label>
      <div className="flex items-center gap-2 mt-1">
        {!isRecording && !audioURL && (
          <Button variant="outline" onClick={startRecording}>
            <Mic className="mr-2 h-4 w-4" />
            Record Note
          </Button>
        )}
        {isRecording && (
          <Button variant="destructive" onClick={stopRecording}>
            <StopCircle className="mr-2 h-4 w-4 animate-pulse" />
            Stop Recording
          </Button>
        )}
        {audioURL && !isRecording && (
          <>
            <audio src={audioURL} controls className="w-full h-10" />
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// A simple Label component if it's not globally available.
// Usually, it's imported from '@/components/ui/label'
const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={`block text-sm font-medium text-foreground ${className}`} {...props} />
);
