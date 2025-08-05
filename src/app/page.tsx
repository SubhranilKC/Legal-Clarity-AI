
'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import type { AnalyzedDocument, AppState, ConversationTurn, Improvement } from '@/types';
import { analyzeDocumentAction, answerQuestionAction, improveDocumentAction, summarizeDocumentAction, humanizeDocumentAction } from '@/app/actions';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import GeneratingLoader from '@/components/generating-loader';
import { useRouter } from 'next/navigation';
import SplineViewer from '@/components/spline-viewer';
import { cn } from '@/lib/utils';
import { LandingHeader } from './landing-header';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MainApp = dynamic(() => import('./main-app'), {
    ssr: false,
    loading: () => <div className="flex-grow flex items-center justify-center"><p>Loading application...</p></div>
});

function LandingView({ onEnter, className }: { onEnter: () => void; className?: string }) {
    // THEME-COHESIVE LANDING PAGE
    // Spline hero at top, About Us below, both styled with unified dark/gradient theme
    return (
      <div className={cn("min-h-screen w-full flex flex-col items-center justify-start bg-gradient-to-br from-zinc-950 via-black to-zinc-900 overflow-x-hidden", className)}>
        {/* Spline Hero Section */}
        <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <SplineViewer />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90 z-10" />
          </div>
          <div className="relative z-20 flex flex-col items-center justify-center w-full h-full text-center pt-32 pb-16">
            <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-500 drop-shadow-lg mb-4">
              Legal Clarity AI
            </h1>
            <p className="text-lg md:text-2xl text-white/90 max-w-2xl mx-auto backdrop-blur-sm bg-black/30 rounded-xl px-6 py-4 shadow-lg">
              Making legal documents clear, actionable, and accessible for everyone.
            </p>
            <div className="flex flex-col md:flex-row gap-4 mt-10 items-center justify-center">
              <button
                onClick={e => {
                  e.stopPropagation();
                  onEnter();
                }}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold text-lg shadow-lg hover:scale-105 transition-transform"
              >
                Get Started
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg shadow-lg hover:scale-105 transition-transform"
              >
                Learn About Us
              </button>
            </div>
          </div>
        </section>
        {/* About Us Section */}
        <section id="about-section" className="w-full flex justify-center bg-black/90 py-16 px-4">
          <div className="max-w-2xl w-full bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 rounded-2xl shadow-xl border border-zinc-700 p-8 text-white/90">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-purple-300 text-center drop-shadow">About Legal Clarity AI</h2>
            <p className="mb-4">
              Legal Clarity AI was born from a simple idea: legal documents should be understandable for everyone, not just lawyers. We believe that by leveraging the power of cutting-edge artificial intelligence, we can demystify complex contracts, agreements, and policies, empowering individuals and businesses to make informed decisions with confidence.
            </p>
            <p className="mb-4">
              Our platform provides a suite of tools aimed at delivering clarity to your legal documents. From clause-by-clause analysis and plain-language summaries to answering complex questions and suggesting improvements, Legal Clarity AI is your personal legal assistant.
            </p>
            <p>
              We are committed to building a more transparent and accessible legal world. Our team is a passionate group of technologists, designers, and legal thinkers dedicated to bridging the boundaries of what’s possible with AI. Thank you for joining us on this journey.
            </p>
          </div>
        </section>
      </div>
    );
}

export default function HomePage() {
  const { toast } = useToast();
  
  const [appState, setAppState] = useState<AppState>({
    documents: [],
    activeDocumentName: '',
    conversation: [],
    improvingState: {},
    summarizingState: {},
    complianceState: {},
  });

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [isMounted, setIsMounted] = useState(false);
  const [landingExited, setLandingExited] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (hasVisited) {
      setView('app');
    }
  }, []);


  const handleAnalyze = async (files: { name: string, dataUri: string }[]) => {
    if (files.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select one or more documents.',
      });
      return;
    }
    setIsAnalyzing(true);
    
    try {
      const results = [];
      for (const file of files) {
        try {
          const result = await analyzeDocumentAction(file.dataUri);
          results.push({
            name: file.name,
            ...result
          });
        } catch (error) {
           console.error(`Failed to analyze ${file.name}:`, error);
           results.push({
             name: file.name,
             clauses: [],
             fullText: '',
             error: true
           });
        }
      }
      
      const newDocs: AnalyzedDocument[] = results.map(r => ({
        name: r.name,
        clauses: r.clauses || [],
        fullText: r.fullText,
      }));

      if (typeof window !== 'undefined') {
        const docsToStore = newDocs.map(({ dataUri, ...rest }) => rest);
        try {
          sessionStorage.setItem('analyzedDocuments', JSON.stringify(docsToStore));
        } catch (e) {
          if (e instanceof Error && e.name === 'QuotaExceededError') {
             console.error("Error storing documents in session storage:", e.message);
             toast({
                variant: 'destructive',
                title: 'Storage Error',
                description: 'The analyzed document content is too large to be stored in the session. Please try smaller documents.',
            });
          } else {
            console.error('Error storing documents in session storage:', e);
          }
        }
      }
      
      setAppState(prevState => ({
          ...prevState,
          documents: newDocs,
          activeDocumentName: newDocs.length > 0 ? newDocs[0].name : '',
      }));

      if (newDocs.length > 0 && results.some(r => !r.error)) {
        const successfulAnalyses = newDocs.filter(d => d.fullText);
        if (successfulAnalyses.length < newDocs.length) {
          toast({
            variant: 'destructive',
            title: 'Partial Analysis Failed',
            description: `Could not analyze all documents. ${successfulAnalyses.length} of ${newDocs.length} were processed.`,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'Could not extract any text or clauses from the documents.',
        });
      }

    } catch (error) {
      if (error instanceof Error) {
        console.error('Error in analyzeDocumentAction:', error.message);
        console.error('Stack trace:', error.stack);
      } else {
        console.error('Non-Error exception in analyzeDocumentAction:', error);
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred during analysis.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskQuestion = async (question: string, scope: string[], language: string) => {
    if (!question.trim() || scope.length === 0) return;
    setIsAnswering(true);
    
    const relevantDocs = appState.documents.filter(d => scope.includes(d.name));
    
    const documentContent = relevantDocs.map(d => `Document: ${d.name}\n\n${d.fullText}`).join('\n\n---\n\n');

    const history = appState.conversation.map(turn => ({
      question: turn.question,
      answer: turn.result.answer,
    }));

    try {
      const result = await answerQuestionAction(documentContent, question, history, language);
      setAppState(prevState => ({
          ...prevState,
          conversation: [...prevState.conversation, { question, scope, result }]
      }));
    } catch (error) {
        let errorMessage = 'An unexpected error occurred while getting the answer.';
        if (error instanceof Error) {
            console.error('Error in answerQuestionAction:', error.message);
            console.error('Stack trace:', error.stack);
            if (error.message.includes('503 Service Unavailable') || error.message.includes('429 Too Many Requests')) {
                errorMessage = 'The AI service is currently overloaded. Please try again in a moment.';
            }
        } else {
            console.error('Non-Error exception in answerQuestionAction:', error);
        }
        toast({
            variant: 'destructive',
            title: 'Error',
            description: errorMessage,
        });
    } finally {
      setIsAnswering(false);
    }
  };

  const handleImproveDocument = async (documentName: string) => {
    const doc = appState.documents.find(d => d.name === documentName);
    if (!doc) return;

    setAppState(prevState => ({
        ...prevState,
        improvingState: { ...prevState.improvingState, [documentName]: { inProgress: true, content: '', replacements: [] } }
    }));

    try {
      const result = await improveDocumentAction(doc.fullText);
      
      let improvedContent = doc.fullText;
      for (const replacement of result.replacements) {
        improvedContent = improvedContent.replace(replacement.original, replacement.improved);
      }

      const humanizedResult = await humanizeDocumentAction(improvedContent);

      setAppState(prevState => ({
        ...prevState,
        improvingState: { ...prevState.improvingState, [documentName]: { inProgress: false, content: humanizedResult.humanizedText, replacements: result.replacements } }
      }));
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error in improveDocumentAction:', error.message);
        console.error('Stack trace:', error.stack);
      } else {
        console.error('Non-Error exception in improveDocumentAction:', error);
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while improving the document.',
      });
      setAppState(prevState => ({
        ...prevState,
        improvingState: { ...prevState.improvingState, [documentName]: { inProgress: false, content: '', replacements: [] } }
      }));
    }
  };

  const handleSummarizeDocument = async (documentName: string) => {
    const doc = appState.documents.find(d => d.name === documentName);
    if (!doc) return;

    setAppState(prevState => ({
      ...prevState,
      summarizingState: {
        ...prevState.summarizingState,
        [documentName]: { inProgress: true, content: '' },
      },
    }));

    try {
      const result = await summarizeDocumentAction(doc.fullText);
      setAppState(prevState => ({
        ...prevState,
        summarizingState: {
          ...prevState.summarizingState,
          [documentName]: { inProgress: false, content: result.humanizedText },
        },
      }));
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error in summarizeDocumentAction:', error.message);
        console.error('Stack trace:', error.stack);
      } else {
        console.error('Non-Error exception in summarizeDocumentAction:', error);
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while summarizing the document.',
      });
      setAppState(prevState => ({
        ...prevState,
        summarizingState: {
          ...prevState.summarizingState,
          [documentName]: { inProgress: false, content: '' },
        },
      }));
    }
  };

  const resetView = () => {
    setAppState({
        documents: [],
        activeDocumentName: '',
        conversation: [],
        improvingState: {},
        summarizingState: {},
        complianceState: {},
    });
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('analyzedDocuments');
        sessionStorage.setItem('hasVisited', 'false');
    }
    setView('landing');
  };

  const setActiveDocName = (name: string) => {
    setAppState(prevState => ({ ...prevState, activeDocumentName: name }));
  };

  const handleEnter = () => {
    sessionStorage.setItem('hasVisited', 'true');
    setView('app');
    setTimeout(() => {
        setLandingExited(true);
    }, 1500); // Match this to the animation duration
  };
  
  if (isAnalyzing) {
    return (
        <div className="mx-auto max-w-lg w-full text-center py-12 flex flex-col items-center justify-center min-h-screen">
            <GeneratingLoader />
            <h2 className="text-2xl font-semibold text-foreground mt-8">Analyzing Documents...</h2>
            <p className="text-muted-foreground">Please wait while the AI processes your files. This may take a moment.</p>
        </div>
    );
  }
  
  if (!isMounted) {
    return null;
  }
  
  if (view === 'landing') {
      if (landingExited) {
        return null;
      }
      return (
        <AnimatePresence>
          {view === 'landing' && <LandingView className={view !== 'landing' ? 'landing-exit' : ''} onEnter={handleEnter} />}
        </AnimatePresence>
      )
  }

  return (
    <>
      <Header />
      <main className="flex-grow flex flex-col p-4">
          <Suspense fallback={<div className="flex-grow flex items-center justify-center"><p>Loading application...</p></div>}>
              <MainApp
              view={appState.documents.length > 0 ? 'analysis' : 'upload'}
              isAnalyzing={isAnalyzing}
              onAnalyze={handleAnalyze}
              appState={appState}
              setActiveDocName={setActiveDocName}
              isAnswering={isAnswering}
              onAskQuestion={handleAskQuestion}
              onImproveDocument={handleImproveDocument}
              onSummarizeDocument={handleSummarizeDocument}
              resetView={resetView}
              />
          </Suspense>
      </main>
      <Footer />
    </>
  );
}
