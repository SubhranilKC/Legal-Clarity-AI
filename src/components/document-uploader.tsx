
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileUp, X, File as FileIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import GeneratingLoader from './generating-loader';


interface DocumentUploaderProps {
  onAnalyze: (files: { name: string; dataUri: string }[]) => void;
  isLoading: boolean;
  showTitle?: boolean;
}

export default function DocumentUploader({ onAnalyze, isLoading, showTitle = true }: DocumentUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => {
      const newFiles = acceptedFiles.filter(
        newFile => !prevFiles.some(prevFile => prevFile.name === newFile.name && prevFile.size === newFile.size)
      );
      return [...prevFiles, ...newFiles];
    });
  }, []);

  const removeFile = (fileToRemove: File) => {
    setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  };


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 10, // Allow up to 10 files
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please upload at least one file to analyze.',
      });
      return;
    }

    const filePromises = files.map(file => {
      return new Promise<{ name: string; dataUri: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          resolve({ name: file.name, dataUri: dataUrl });
        };
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          reject(new Error(`Failed to read file: ${file.name}`));
        };
        reader.readAsDataURL(file);
      });
    });

    try {
        const fileData = await Promise.all(filePromises);
        onAnalyze(fileData);
    } catch (error) {
        if (error instanceof Error) {
            toast({
                variant: 'destructive',
                title: 'Error reading files',
                description: error.message,
              });
        }
    }
  };

  if (isLoading) {
    return (
        <div className="mx-auto max-w-lg w-full text-center py-12 flex flex-col items-center justify-center">
            <GeneratingLoader />
            <h2 className="text-2xl font-semibold text-foreground mt-8">Analyzing Documents...</h2>
            <p className="text-muted-foreground">Please wait while the AI processes your files. This may take a moment.</p>
        </div>
    );
  }

  return (
    <div className="mx-auto w-full py-12">
      {showTitle && (
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4">
            <span className="gemini-text-gradient">Legal Clarity AI</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mx-auto">
            Unlock insights from your legal documents. Upload files to instantly analyze clauses, get summaries, and ask questions with the power of AI.
          </p>
        </div>
      )}

      <Card className="shadow-2xl border-0 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-all
                ${isDragActive ? 'border-primary bg-primary/10 scale-105' : 'border-border/50 hover:border-primary/70'}`}
            >
              <input {...getInputProps()} />
              <FileUp className="w-16 h-16 text-primary mb-4 transform transition-transform duration-300 group-hover:scale-110" />
              <p className="text-center text-muted-foreground">
                {isDragActive ? 'Drop your documents here...' : "Drag 'n' drop files, or click to select"}
              </p>
               <p className="text-xs text-muted-foreground mt-2">Supports .txt, .pdf, .doc, .docx, .png, .jpg</p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Selected Files:</h3>
                <ScrollArea className="h-32 w-full rounded-md border p-2">
                    <ul className="space-y-2">
                    {files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileIcon className="h-5 w-5 flex-shrink-0" />
                                <span className="truncate text-sm">{file.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeFile(file); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </li>
                    ))}
                    </ul>
                </ScrollArea>
              </div>
            )}


            <Button type="submit" className="w-full text-lg" disabled={isLoading || files.length === 0} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                `Analyze ${files.length} Document${files.length === 1 ? '' : 's'}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
