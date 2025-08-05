
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Separator } from '@/components/ui/separator';

export default function AboutPage() {
    return (
        <>
            <Header />
            <div className="flex flex-1 flex-col items-center justify-center bg-background text-foreground py-12 px-4">
                <Card className="shadow-2xl border-0 bg-card/60 backdrop-blur-sm w-full max-w-5xl shadow-[0_0_30px_5px_hsl(var(--primary)/0.2)]">
                    <CardHeader className="text-center">
                        <CardTitle className="text-4xl font-extrabold tracking-tighter gemini-text-gradient">
                            About Legal Clarity AI
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 text-lg text-foreground/80 text-center">
                        <p>
                            Legal Clarity AI was born from a simple idea: legal documents should be understandable for everyone, not just lawyers. We believe that by leveraging the power of cutting-edge artificial intelligence, we can demystify complex contracts, agreements, and policies, empowering individuals and businesses to make informed decisions with confidence.
                        </p>
                        <p>
                            Our platform provides a suite of tools designed to bring clarity to your legal documents. From clause-by-clause analysis and plain-language summaries to answering complex questions and suggesting improvements, Legal Clarity AI is your personal legal assistant.
                        </p>
                        <p>
                            We are committed to building a more transparent and accessible legal world. Our team is a passionate group of technologists, designers, and legal enthusiasts dedicated to pushing the boundaries of what's possible with AI. Thank you for joining us on this journey.
                        </p>

                        <Separator className="my-8" />

                        <div className="space-y-4">
                            <h3 className="text-3xl font-bold tracking-tighter gemini-text-gradient">Contact Us</h3>
                            <p>Have questions or feedback? We'd love to hear from you.</p>
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 pt-4">
                                <a href="mailto:support@legalclarity.ai" className="flex items-center gap-2 text-lg md:text-xl font-semibold text-primary hover:underline">
                                    <Mail className="h-6 w-6" />
                                    support@legalclarity.ai
                                </a>
                                <span className="flex items-center gap-2 text-lg md:text-xl font-semibold text-primary">
                                    <Phone className="h-6 w-6" />
                                    +1 (555) 123-4567
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Footer />
        </>
    );
}
