export default function AboutSection() {
  return (
    <section className="w-full flex justify-center bg-black/90 py-16 px-4">
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
  );
}
