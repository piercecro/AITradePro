import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Do I need trading experience to use AiTradePro?',
    answer: 'AiTradePro is designed to make automated trading tools approachable for a range of experience levels. Take time to understand how the bot works, review its settings, and consider the risks before using it.',
  },
  {
    question: 'How does AiTradePro automated trading work?',
    answer: 'AiTradePro uses an automated bot to place or manage trades according to its configured strategy. Where profit-sharing applies, 5–15% of profits generated may be allocated according to the applicable account terms. This is a share of profits, not a promised daily return; the bot may not generate profits, and trading can result in losses.',
  },
  {
    question: 'Does AiTradePro guarantee profits or prevent losses?',
    answer: 'No. AiTradePro does not guarantee profits or loss-free trading. Automated trading involves financial risk, and you could lose some or all of the money you trade. Profit-sharing percentages are not guaranteed returns, and past performance does not predict future results.',
  },
  {
    question: 'Which markets can I explore on AiTradePro?',
    answer: 'The platform interface includes crypto, forex, stocks, metals, indices, and bonds. Live data and trading availability can vary by instrument, region, and connected service.',
  },
  {
    question: 'How do I get started?',
    answer: 'Create an AiTradePro account, explore the available trading tools, and follow the in-app instructions to configure your account. Check the details of any connected service before enabling trading.',
  },
  {
    question: 'Can I choose how my trading tools are configured?',
    answer: 'Available settings depend on the tool you are using. Review and adjust configuration options to suit your own approach, and understand them before enabling any orders.',
  },
  {
    question: 'How can I contact AiTradePro support?',
    answer: 'Use the Support option in the app to send a request to the AiTradePro support team.',
  },
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section aria-labelledby="faq-heading" className="bg-[#08090c] px-4 py-16 text-white sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-center text-sm font-bold uppercase tracking-[0.2em] text-sky-400">AiTradePro help center</p>
        <h2 id="faq-heading" className="mb-8 text-center text-3xl font-extrabold tracking-tight sm:mb-10 sm:text-4xl">
          Frequently asked questions
        </h2>

        <div className="divide-y divide-white/10 border-y border-white/10">
          {faqs.map(({ question, answer }, index) => {
            const isOpen = openIndex === index;
            const answerId = `faq-answer-${index}`;

            return (
              <div key={question} className="py-1">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left text-base font-bold text-white transition-colors hover:text-sky-300 sm:text-lg"
                  >
                    <span>{question}</span>
                    <ChevronDown size={22} aria-hidden="true" className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </h3>
                {isOpen && (
                  <div id={answerId} className="max-w-5xl pb-5 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                    {answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
