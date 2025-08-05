
'use client';

import { useState, useEffect, useRef } from 'react';
import type { ConversationTurn, AnalyzedDocument } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquareQuote, BookCheck, ChevronsRight, Send, User, Check, ChevronsUpDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';


interface QAInterfaceProps {
  onAskQuestion: (question: string, scope: string[], language: string) => void;
  isLoading: boolean;
  conversation: ConversationTurn[];
  documents: AnalyzedDocument[];
  activeDocumentName: string;
}

const LANGUAGES = [
    { value: 'af', label: 'Afrikaans' },
    { value: 'sq', label: 'Albanian (Shqip)' },
    { value: 'am', label: 'Amharic (አማርኛ)' },
    { value: 'ar', label: 'Arabic (العربية)' },
    { value: 'hy', label: 'Armenian (Հայերեն)' },
    { value: 'az', label: 'Azerbaijani (Azərbaycan dili)' },
    { value: 'eu', label: 'Basque (Euskara)' },
    { value: 'be', label: 'Belarusian (Беларуская мова)' },
    { value: 'bn', label: 'Bengali (বাংলা)' },
    { value: 'bs', label: 'Bosnian (Bosanski jezik)' },
    { value: 'bg', label: 'Bulgarian (Български език)' },
    { value: 'ca', label: 'Catalan (Català)' },
    { value: 'ceb', label: 'Cebuano' },
    { value: 'ny', label: 'Chichewa' },
    { value: 'zh-CN', label: 'Chinese (Simplified) (简体中文)' },
    { value: 'zh-TW', label: 'Chinese (Traditional) (繁體中文)' },
    { value: 'co', label: 'Corsican (Corsu)' },
    { value: 'hr', label: 'Croatian (Hrvatski jezik)' },
    { value: 'cs', label: 'Czech (Čeština)' },
    { value: 'da', label: 'Danish (Dansk)' },
    { value: 'nl', label: 'Dutch (Nederlands)' },
    { value: 'en', label: 'English' },
    { value: 'eo', label: 'Esperanto' },
    { value: 'et', label: 'Estonian (Eesti)' },
    { value: 'tl', label: 'Filipino' },
    { value: 'fi', label: 'Finnish (Suomi)' },
    { value: 'fr', label: 'French (Français)' },
    { value: 'fy', label: 'Frisian (Frysk)' },
    { value: 'gl', label: 'Galician (Galego)' },
    { value: 'ka', label: 'Georgian (ქართული)' },
    { value: 'de', label: 'German (Deutsch)' },
    { value: 'el', label: 'Greek (Ελληνικά)' },
    { value: 'gu', label: 'Gujarati (ગુજરાતી)' },
    { value: 'ht', label: 'Haitian Creole (Kreyòl ayisyen)' },
    { value: 'ha', label: 'Hausa (Harshen Hausa)' },
    { value: 'Hawaiian', label: 'Hawaiian (Ōlelo Hawaiʻi)' },
    { value: 'Hebrew', label: 'Hebrew (עִבְרִית)' },
    { value: 'Hindi', label: 'Hindi (हिन्दी)' },
    { value: 'Hmong', label: 'Hmong' },
    { value: 'Hungarian', label: 'Hungarian (Magyar)' },
    { value: 'Icelandic', label: 'Icelandic (Íslenska)' },
    { value: 'Igbo', label: 'Igbo (Asụsụ Igbo)' },
    { value: 'Indonesian', label: 'Indonesian (Bahasa Indonesia)' },
    { value: 'Irish', label: 'Irish (Gaeilge)' },
    { value: 'Italian', label: 'Italian (Italiano)' },
    { value: 'Japanese', label: 'Japanese (日本語)' },
    { value: 'Javanese', label: 'Javanese (Basa Jawa)' },
    { value: 'Kannada', label: 'Kannada (ಕನ್ನಡ)' },
    { value: 'Kazakh', label: 'Kazakh (Қазақ тілі)' },
    { value: 'Khmer', label: 'Khmer (ភាសាខ្មែរ)' },
    { value: 'Kinyarwanda', label: 'Kinyarwanda' },
    { value: 'Korean', label: 'Korean (한국어)' },
    { value: 'Kurdish (Kurmanji)', label: 'Kurdish (Kurmanji) (Kurdî (Kurmancî))' },
    { value: 'Kyrgyz', label: 'Kyrgyz (Кыргызча)' },
    { value: 'Lao', label: 'Lao (ພາສາລາວ)' },
    { value: 'Latin', label: 'Latin (Latine)' },
    { value: 'Latvian', label: 'Latvian (Latviešu valoda)' },
    { value: 'Lithuanian', label: 'Lithuanian (Lietuvių kalba)' },
    { value: 'Luxembourgish', label: 'Luxembourgish (Lëtzebuergesch)' },
    { value: 'Macedonian', label: 'Macedonian (Македонски јазик)' },
    { value: 'Malagasy', label: 'Malagasy (Fiteny malagasy)' },
    { value: 'Malay', label: 'Malay (Bahasa Melayu)' },
    { value: 'Malayalam', label: 'Malayalam (മലയാളം)' },
    { value: 'Maltese', label: 'Maltese (Malti)' },
    { value: 'Maori', label: 'Maori (Te reo Māori)' },
    { value: 'Marathi', label: 'Marathi (मराठी)' },
    { value: 'Mongolian', label: 'Mongolian (Монгол)' },
    { value: 'Myanmar (Burmese)', label: 'Myanmar (Burmese) (ဗမာစာ)' },
    { value: 'Nepali', label: 'Nepali (नेपाली)' },
    { value: 'Norwegian', label: 'Norwegian (Norsk)' },
    { value: 'Odia (Oriya)', label: 'Odia (Oriya) (ଓଡ଼ିଆ)' },
    { value: 'Pashto', label: 'Pashto (پښتو)' },
    { value: 'Persian', label: 'Persian (فارسی)' },
    { value: 'Polish', label: 'Polish (Polski)' },
    { value: 'Portuguese', label: 'Portuguese (Português)' },
    { value: 'Punjabi', label: 'Punjabi (ਪੰਜਾਬੀ)' },
    { value: 'Romanian', label: 'Romanian (Română)' },
    { value: 'Russian', label: 'Russian (Русский)' },
    { value: 'Samoan', label: 'Samoan (Gagana faa Samoa)' },
    { value: 'Scots Gaelic', label: 'Scots Gaelic (Gàidhlig)' },
    { value: 'Serbian', label: 'Serbian (Српски језик)' },
    { value: 'Sesotho', label: 'Sesotho' },
    { value: 'Shona', label: 'Shona (chiShona)' },
    { value: 'Sindhi', label: 'Sindhi (सिन्धी)' },
    { value: 'Sinhala', label: 'Sinhala (සිංහල)' },
    { value: 'Slovak', label: 'Slovak (Slovenčina)' },
    { value: 'Slovenian', label: 'Slovenian (Slovenščina)' },
    { value: 'Somali', label: 'Somali (Soomaaliga)' },
    { value: 'Spanish', label: 'Spanish (Español)' },
    { value: 'Sundanese', label: 'Sundanese (Basa Sunda)' },
    { value: 'Swahili', label: 'Swahili (Kiswahili)' },
    { value: 'Swedish', label: 'Swedish (Svenska)' },
    { value: 'Tajik', label: 'Tajik (Тоҷикӣ)' },
    { value: 'Tamil', label: 'Tamil (தமிழ்)' },
    { value: 'Tatar', label: 'Tatar (Татар)' },
    { value: 'Telugu', label: 'Telugu (తెలుగు)' },
    { value: 'Thai', label: 'Thai (ไทย)' },
    { value: 'Turkish', label: 'Turkish (Türkçe)' },
    { value: 'Turkmen', label: 'Turkmen (Türkmen)' },
    { value: 'Ukrainian', label: 'Ukrainian (Українська)' },
    { value: 'Urdu', label: 'Urdu (اردو)' },
    { value: 'Uyghur', label: 'Uyghur (ئۇيغۇرچە)' },
    { value: 'Uzbek', label: 'Uzbek (Oʻzbekcha)' },
    { value: 'Vietnamese', label: 'Vietnamese (Tiếng Việt)' },
    { value: 'Welsh', label: 'Welsh (Cymraeg)' },
    { value: 'Xhosa', label: 'Xhosa (isiXhosa)' },
    { value: 'Yiddish', label: 'Yiddish (ייִדיש)' },
    { value: 'Yoruba', label: 'Yoruba (Yorùbá)' },
    { value: 'Zulu', label: 'Zulu (IsiZulu)' },
];

function getScopeDisplay(scope: string[]): string {
    if (scope.length === 0) return 'No documents';
    if (scope.length === 1) return scope[0];
    if (scope.length > 1) return `${scope.length} documents`;
    return 'N/A';
}

function ConversationHistory({ conversation, onAskQuestion, isLoading, documents }: { conversation: ConversationTurn[], onAskQuestion: (q: string, scope: string[], lang: string) => void, isLoading: boolean, documents: AnalyzedDocument[] }) {
  if (conversation.length === 0) return null;
  const lastTurn = conversation[conversation.length - 1];
  const [language, setLanguage] = useState('en');

  const allDocNames = documents.map(d => d.name);
  const isAllDocsScope = (scope: string[]) => scope.length === allDocNames.length && allDocNames.every(name => scope.includes(name));

  return (
      <ScrollArea className="h-[60vh] w-full pr-4">
        <div className="space-y-6">
          {conversation.map((turn, index) => (
            <div key={index} className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-3 w-full">
                  <p className="font-semibold">You</p>
                  <p className="text-xs text-muted-foreground">Scope: {isAllDocsScope(turn.scope) ? 'All Documents' : turn.scope.join(', ')}</p>
                  <p className="text-foreground/90 mt-1">{turn.question}</p>
                </div>
              </div>
  
              <div className="flex items-start gap-3">
                 <div className="bg-accent/10 p-2 rounded-full">
                    <MessageSquareQuote className="h-5 w-5 text-accent" />
                 </div>
                <div className="bg-card rounded-lg p-3 w-full border">
                  <p className="font-semibold text-accent">Legal Clarity AI</p>
                  <div className="space-y-4 mt-2">
                    <div>
                      <h3 className="font-semibold text-primary">Answer</h3>
                      {/* Extract summary: If answer starts with Yes/No, show as summary. Otherwise, generate a summary from the answer. */}
                      {(() => {
                        // Use coverageStatus and summary from backend if available, else fallback
                        const answer = turn.result.answer || '';
                        // Support: coverageStatus: 'yes' | 'no' | 'not mentioned', summary: string
                        const coverageStatus = turn.result.coverageStatus || null;
                        const summaryFromApi = turn.result.summary || '';
                        let summary = '';
                        let summaryType = '';
                        if (coverageStatus) {
                          summaryType = coverageStatus;
                          if (summaryFromApi) {
                            summary = summaryFromApi;
                          } else if (coverageStatus === 'yes') {
                            summary = 'Yes, the policy covers this scenario.';
                          } else if (coverageStatus === 'no') {
                            summary = 'No, the policy does not cover this scenario.';
                          } else {
                            summary = 'This scenario is not mentioned in the document.';
                          }
                        } else {
                          // Fallback: legacy detection
                          const yesPattern = /\b(yes|covered|is covered|will be covered|are covered|policy covers|is included|is payable|is allowed|is eligible|is permitted|is authorized|is listed|is described|is addressed|is contained|is present|is stated|is disclosed|is referenced|is documented|is available)\b/i;
                          const noPattern = /\b(no|not covered|not found|not available|not provided|not included|not specified|not mentioned|not applicable|not supported|not eligible|not permitted|not allowed|not authorized|not listed|not described|not addressed|not contained|not present|not stated|not disclosed|not referenced|not documented|not payable|not included|not allowed)\b/i;
                          const yesNoMatch = answer.match(/^(Yes|No)[,\s\-:]/i);
                          if (yesNoMatch) {
                            summary = answer.split(/[.\n]/)[0];
                            summaryType = yesNoMatch[1].toLowerCase() === 'yes' ? 'yes' : 'no';
                          } else if (yesPattern.test(answer) && !noPattern.test(answer)) {
                            summary = 'Yes, the policy covers this scenario.';
                            summaryType = 'yes';
                          } else if (noPattern.test(answer)) {
                            summary = 'No, the policy does not cover this scenario.';
                            summaryType = 'no';
                          } else {
                            summary = answer.split(/[.\n]/)[0];
                            summaryType = '';
                          }
                        }
                        let summaryColor = '';
                        if (summaryType === 'no') summaryColor = 'bg-red-50 border border-red-200 text-red-800';
                        else if (summaryType === 'yes') summaryColor = 'bg-green-50 border border-green-200 text-green-900';
                        else if (summaryType === 'not mentioned') summaryColor = 'bg-gray-50 border border-gray-200 text-gray-900';
                        else summaryColor = 'bg-gray-50 border border-gray-200 text-gray-900';
                        return (
                          <div>
                            <div className={summaryColor + " rounded-md px-4 py-2 mb-2"}>
                              <span className="font-semibold">{summaryType === 'no' ? 'No:' : summaryType === 'yes' ? 'Yes:' : summaryType === 'not mentioned' ? 'Not Mentioned:' : 'Summary:'}</span> {summary}
                            </div>
                            <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{answer}</p>
                          </div>
                        );
                      })()}
                      {turn.result.explanation && (
                        <div className="mt-2">
                          <h4 className="font-semibold text-primary/80 text-sm">Explanation</h4>
                          <p className="text-foreground/80 text-sm leading-relaxed">{turn.result.explanation}</p>
                        </div>
                      )}
                      {turn.result.assumptions && (
                        <div className="mt-2">
                          <h4 className="font-semibold text-primary/80 text-sm">Assumptions / Clarifications</h4>
                          <p className="text-foreground/80 text-sm leading-relaxed">{turn.result.assumptions}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Clause Analysis & Feedback</h3>
                      <p className="text-foreground/90 leading-relaxed">{turn.result.feedback}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary flex items-center mt-4">
                        <BookCheck className="mr-2 h-4 w-4" />
                        Citations (Source in Document)
                      </h3>
                      {(() => {
                        // If citations array is empty, try to extract inline citations from the answer
                        let citations = turn.result.citations && turn.result.citations.length > 0 ? turn.result.citations.slice() : [];
                        const answer = turn.result.answer || '';
                        // Regex to extract inline citations like: 'From ...', (Page ...), etc.
                        const inlineCitationRegex = /(['"]?Global Health Care[/'\w\s\-\.]+Page \d+['"]?)/gi;
                        if (citations.length === 0) {
                          const found = answer.match(inlineCitationRegex);
                          if (found) {
                            citations = found;
                          }
                        }
                        if (citations.length > 0) {
                          return (
                            <div className="space-y-2 mt-1">
                              {citations.map((citation: string, i: number) => {
                                // Try to extract document name and quoted text for clarity
                                const match = citation.match(/^From '([^']+)'\s*:\s*([\s\S]*)$/);
                                return (
                                  <blockquote key={i} className="border-l-2 border-primary/50 pl-3 italic text-sm text-foreground/70 bg-muted/50 py-2">
                                    {match ? (
                                      <>
                                        <span className="font-semibold text-primary/80">{match[1]}</span>
                                        <span className="ml-2">{match[2]}</span>
                                      </>
                                    ) : (
                                      <span>{citation}</span>
                                    )}
                                  </blockquote>
                                );
                              })}
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-sm text-muted-foreground italic mt-1">No direct citation available from the document for this answer.</div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              {/* Render follow-up for the last question only */}
              {index === conversation.length - 1 && lastTurn.result.followUpQuestions && lastTurn.result.followUpQuestions.length > 0 && (
                 <div className="ml-12 pl-1 space-y-2">
                    <h3 className="flex items-center text-md font-semibold text-primary">
                       <ChevronsRight className="mr-2 h-5 w-5" />
                        Suggested Follow-up Questions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {lastTurn.result.followUpQuestions.map((followUp: string, i: number) => (
                            <Button key={i} variant="outline" size="sm" onClick={() => onAskQuestion(followUp, lastTurn.scope, language)} disabled={isLoading}>
                                {followUp}
                            </Button>
                        ))}
                    </div>
                </div>
              )}
               <Separator className="my-6" />
            </div>
          ))}
        </div>
      </ScrollArea>
  );
}


function MultiSelectScope({ documents, selected, setSelected, disabled }: { documents: AnalyzedDocument[], selected: string[], setSelected: (selected: string[]) => void, disabled: boolean }) {
    const [open, setOpen] = useState(false);
    const allDocNames = documents.map(d => d.name);
    const allSelected = allDocNames.length > 0 && selected.length === allDocNames.length;
    
    const handleToggleAll = () => {
        if (allSelected) {
            setSelected([]);
        } else {
            setSelected(allDocNames);
        }
    };
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled || documents.length === 0}
                >
                    <span className="truncate">
                    {selected.length === 0 && "Select scope..."}
                    {selected.length === 1 && selected[0]}
                    {selected.length > 1 && `${selected.length} documents selected`}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandList>
                        <CommandGroup>
                             {documents.length > 1 && (
                                <CommandItem
                                    onSelect={handleToggleAll}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            allSelected ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    Select All
                                </CommandItem>
                            )}
                            {documents.map((doc) => (
                                <CommandItem
                                    key={doc.name}
                                    value={doc.name}
                                    onSelect={(currentValue) => {
                                        const isSelected = selected.includes(doc.name);
                                        if (isSelected) {
                                            setSelected(selected.filter(name => name !== doc.name));
                                        } else {
                                            setSelected([...selected, doc.name]);
                                        }
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selected.includes(doc.name) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {doc.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <CommandEmpty>No documents found.</CommandEmpty>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function LanguageSelector({ language, setLanguage, disabled }: { language: string, setLanguage: (lang: string) => void, disabled: boolean }) {
    const [open, setOpen] = useState(false);
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    <span className="truncate">
                    {LANGUAGES.find(l => l.value === language)?.label || "Select language..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search language..." />
                    <CommandList>
                        <CommandEmpty>No language found.</CommandEmpty>
                        <CommandGroup>
                            {LANGUAGES.map((lang) => (
                                <CommandItem
                                    key={lang.value}
                                    value={lang.label}
                                    onSelect={(currentValue) => {
                                        const selectedLang = LANGUAGES.find(l => l.label.toLowerCase() === currentValue.toLowerCase());
                                        if (selectedLang) {
                                            setLanguage(selectedLang.value);
                                        }
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            language === lang.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {lang.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}


export default function QAInterface({ onAskQuestion, isLoading, conversation, documents, activeDocumentName }: QAInterfaceProps) {
  const [question, setQuestion] = useState('');
  const [scope, setScope] = useState<string[]>([activeDocumentName]);
  // Default to 'en' (English code), not label
  const [language, setLanguage] = useState('en');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // When active document changes, reset scope to just that document.
    setScope([activeDocumentName]);
  }, [activeDocumentName]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && scope.length > 0) {
      // Always send language code
      onAskQuestion(question, scope, language);
      setQuestion('');
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    }
  }


  return (
    <Card className="shadow-lg h-fit">
      <CardHeader>
        <CardTitle className="font-headline">Ask a Question</CardTitle>
        <CardDescription>
          Select documents, choose a language, and ask a question for AI-powered analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {conversation.length > 0 && <ConversationHistory conversation={conversation} onAskQuestion={onAskQuestion} isLoading={isLoading} documents={documents} />}
        {isLoading && conversation.length === 0 && (
            <div className="flex flex-col items-center text-muted-foreground text-sm w-full justify-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg">Analyzing Answer...</p>
                <p>Please wait while the AI processes your question.</p>
            </div>
        )}
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="qa-scope">Question Scope</Label>
                <MultiSelectScope documents={documents} selected={scope} setSelected={setScope} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="qa-language">Response Language</Label>
                <LanguageSelector language={language} setLanguage={setLanguage} disabled={isLoading} />
            </div>
          </div>
          <div className="w-full flex items-center gap-2">
            <Textarea
              ref={textareaRef}
              placeholder={conversation.length > 0 ? "Ask a follow-up..." : "e.g., What is the liability limit?"}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="min-h-[40px] max-h-[200px] resize-none transition-all duration-100 focus:shadow-lg focus:shadow-primary/20"
              rows={1}
            />
            <Button type="submit" size="icon" disabled={isLoading || !question.trim() || scope.length === 0}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
           </div>
        </form>
      </CardFooter>
    </Card>
  );
}
