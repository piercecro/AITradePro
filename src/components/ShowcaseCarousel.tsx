import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const getSlides = () => [
  {
    title: 'Trading tools at a glance',
    description: 'Explore a clear workspace for markets, assets, and trade settings.',
    Illustration: AssetSelectionIllustration,
  },
  {
    title: 'Follow the market',
    description: 'View price movement and order information in one focused interface.',
    Illustration: MarketChartIllustration,
  },
  {
    title: 'Choose your strategy settings',
    description: 'Review strategy options and activity from your AiTradePro workspace.',
    Illustration: StrategyIllustration,
  },
];

export const ShowcaseCarousel = () => {
  const slides = getSlides();
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = slides[activeSlide];
  const Illustration = slide.Illustration;
  const showPrevious = () => setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  const showNext = () => setActiveSlide((current) => (current + 1) % slides.length);

  return (
    <section aria-label="AiTradePro platform showcase" className="bg-[#08090c] px-4 py-14 text-white sm:px-8 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-center text-sm font-bold uppercase tracking-[0.2em] text-violet-300">Inside AiTradePro</p>
        <h2 className="mb-8 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">A closer look at the platform</h2>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c0b14] shadow-[0_30px_90px_rgba(70,35,180,0.2)]" aria-roledescription="carousel">
          <div className="grid min-h-[340px] items-center gap-8 p-6 sm:min-h-[440px] sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:p-14">
            <div className="relative z-10">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">{String(activeSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</p>
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">{slide.title}</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-300 sm:text-base">{slide.description}</p>
              <p className="mt-5 text-xs leading-5 text-slate-400">Interface illustrations are for display purposes. Trading involves risk and results are not guaranteed.</p>
            </div>
            <div className="flex min-w-0 items-center justify-center">
              <Illustration />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 sm:px-8">
            <button type="button" onClick={showPrevious} aria-label="Previous showcase slide" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2" role="group" aria-label="Choose showcase slide">
              {slides.map((item, index) => (
                <button key={item.title} type="button" onClick={() => setActiveSlide(index)} aria-label={`Show slide ${index + 1}: ${item.title}`} aria-current={activeSlide === index ? 'true' : undefined} className={`h-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#0c0b14] ${activeSlide === index ? 'w-8 bg-violet-400' : 'w-2.5 bg-slate-600 hover:bg-slate-400'}`} />
              ))}
            </div>
            <button type="button" onClick={showNext} aria-label="Next showcase slide" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const AssetSelectionIllustration = () => (
  <svg viewBox="0 0 760 470" role="img" aria-label="Illustration of AiTradePro asset selection and trading controls" className="h-auto w-full max-w-[650px] drop-shadow-2xl">
    <defs>
      <linearGradient id="assetGlow" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#382078"/><stop offset="1" stopColor="#111018"/></linearGradient>
      <linearGradient id="phoneGlow" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#24174b"/><stop offset="1" stopColor="#090a10"/></linearGradient>
    </defs>
    <rect x="12" y="32" width="736" height="408" rx="34" fill="url(#assetGlow)" stroke="#34313f" strokeWidth="2" />
    <rect x="32" y="91" width="220" height="305" rx="20" fill="#101016" stroke="#30303b" />
    <text x="54" y="125" fill="#f8fafc" fontSize="17" fontFamily="Arial" fontWeight="700">Select asset</text>
    <rect x="50" y="143" width="83" height="27" rx="13" fill="#f8fafc"/><text x="70" y="162" fill="#111318" fontSize="12" fontFamily="Arial">Popular</text>
    <g fontFamily="Arial" fill="#e6e5ec"><circle cx="68" cy="207" r="16" fill="#e99435"/><text x="59" y="213" fill="white" fontSize="16">₿</text><text x="96" y="205" fontSize="13" fontWeight="700">BTC</text><text x="96" y="222" fill="#92909e" fontSize="11">Bitcoin</text>
      <circle cx="68" cy="265" r="16" fill="#7461cb"/><text x="59" y="270" fill="white" fontSize="12">Au</text><text x="96" y="263" fontSize="13" fontWeight="700">XAU</text><text x="96" y="280" fill="#92909e" fontSize="11">Gold vs US Dollar</text>
      <circle cx="68" cy="323" r="16" fill="#335d9e"/><text x="96" y="321" fontSize="13" fontWeight="700">EUR/USD</text><text x="96" y="338" fill="#92909e" fontSize="11">Euro vs US Dollar</text></g>
    <rect x="280" y="18" width="238" height="430" rx="38" fill="#07080c" stroke="#777580" strokeWidth="3"/>
    <rect x="290" y="31" width="218" height="404" rx="29" fill="url(#phoneGlow)" stroke="#292832"/>
    <rect x="365" y="40" width="68" height="13" rx="7" fill="#030407"/>
    <text x="311" y="83" fill="#a8a6b0" fontSize="12" fontFamily="Arial">AiTradePro workspace</text>
    <text x="311" y="111" fill="#f8fafc" fontSize="18" fontFamily="Arial" fontWeight="700">Trade settings</text>
    <text x="311" y="144" fill="#9694a1" fontSize="12" fontFamily="Arial">Selected market</text>
    <rect x="307" y="155" width="184" height="52" rx="13" fill="#22212a"/><text x="322" y="187" fill="#fff" fontSize="14" fontFamily="Arial" fontWeight="700">EUR/USD</text><text x="450" y="187" fill="#bdb9ca" fontSize="16" fontFamily="Arial">›</text>
    <text x="311" y="237" fill="#9694a1" fontSize="12" fontFamily="Arial">Order size</text>
    <rect x="307" y="248" width="184" height="48" rx="13" fill="#22212a"/><text x="322" y="278" fill="#f8fafc" fontSize="14" fontFamily="Arial">Set your amount</text>
    <text x="311" y="326" fill="#b6a2ff" fontSize="12" fontFamily="Arial">Strategy settings</text>
    <rect x="307" y="339" width="184" height="36" rx="12" fill="#33245f"/><text x="337" y="362" fill="#fff" fontSize="12" fontFamily="Arial">Review configuration</text>
    <rect x="530" y="92" width="199" height="304" rx="18" fill="#0c0d13" stroke="#30303b"/>
    <g stroke="#292a34" strokeWidth="1"><path d="M548 145h164M548 197h164M548 249h164M548 301h164M548 353h164"/><path d="M581 119v250M632 119v250M683 119v250"/></g>
    <path d="M550 310 574 283 594 300 613 235 630 257 647 207 665 226 683 176 704 194" fill="none" stroke="#a77bff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="549" y="120" fill="#c9c6d1" fontSize="12" fontFamily="Arial">Market chart</text>
  </svg>
);

const MarketChartIllustration = () => (
  <svg viewBox="0 0 760 470" role="img" aria-label="Illustration of a live market chart and order overview" className="h-auto w-full max-w-[650px] drop-shadow-2xl">
    <defs><linearGradient id="chartBg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#191335"/><stop offset="1" stopColor="#080a10"/></linearGradient><linearGradient id="chartShade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7956db" stopOpacity=".42"/><stop offset="1" stopColor="#7956db" stopOpacity="0"/></linearGradient></defs>
    <rect x="18" y="32" width="724" height="406" rx="32" fill="url(#chartBg)" stroke="#34313f" strokeWidth="2"/>
    <rect x="45" y="64" width="670" height="300" rx="20" fill="#0b0c12" stroke="#2c2b36"/>
    <text x="72" y="98" fill="#f8fafc" fontSize="17" fontFamily="Arial" fontWeight="700">AiTradePro · Market overview</text>
    <text x="625" y="98" fill="#57d2ad" fontSize="12" fontFamily="Arial">● Market data</text>
    <g stroke="#282a34" strokeWidth="1"><path d="M70 145h620M70 197h620M70 249h620M70 301h620"/><path d="M170 120v214M270 120v214M370 120v214M470 120v214M570 120v214"/></g>
    <path d="M72 282 125 266 168 280 211 220 257 235 302 183 347 207 394 162 438 185 483 142 530 173 575 134 620 156 683 121v212H72Z" fill="url(#chartShade)"/>
    <path d="M72 282 125 266 168 280 211 220 257 235 302 183 347 207 394 162 438 185 483 142 530 173 575 134 620 156 683 121" fill="none" stroke="#8f72f5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <g fill="#d5caff" stroke="#8f72f5" strokeWidth="3"><circle cx="211" cy="220" r="5"/><circle cx="302" cy="183" r="5"/><circle cx="394" cy="162" r="5"/><circle cx="483" cy="142" r="5"/><circle cx="575" cy="134" r="5"/></g>
    <rect x="81" y="386" width="280" height="32" rx="16" fill="#1c1b27" stroke="#393644"/><circle cx="101" cy="402" r="5" fill="#49c9a5"/><text x="115" y="407" fill="#c9c6d1" fontSize="12" fontFamily="Arial">Market activity and order status</text>
    <rect x="390" y="386" width="318" height="32" rx="16" fill="#1c1b27" stroke="#393644"/><text x="410" y="407" fill="#b7a4ff" fontSize="12" fontFamily="Arial">Tools to monitor your configured trades</text>
  </svg>
);

const StrategyIllustration = () => (
  <svg viewBox="0 0 760 470" role="img" aria-label="Illustration of configurable trading strategy panels and activity" className="h-auto w-full max-w-[650px] drop-shadow-2xl">
    <defs><linearGradient id="strategyBg" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#261654"/><stop offset="1" stopColor="#0b0b11"/></linearGradient></defs>
    <rect x="18" y="24" width="724" height="422" rx="32" fill="url(#strategyBg)" stroke="#34313f" strokeWidth="2"/>
    <rect x="47" y="52" width="666" height="166" rx="22" fill="#0b0b12" stroke="#373443"/>
    <text x="75" y="86" fill="#f8fafc" fontSize="17" fontFamily="Arial" fontWeight="700">Strategy activity</text>
    <text x="75" y="111" fill="#92909e" fontSize="12" fontFamily="Arial">Illustrative chart view</text>
    <g stroke="#292a34" strokeWidth="1"><path d="M76 145h350M76 177h350"/><path d="M146 126v70M216 126v70M286 126v70M356 126v70"/></g>
    <path d="M79 181 116 171 150 178 185 153 220 162 254 139 288 151 326 130 359 145 401 121" fill="none" stroke="#55c9ad" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="455" y="107" width="225" height="82" rx="16" fill="#17151f" stroke="#373443"/><text x="477" y="137" fill="#c6c2d0" fontSize="12" fontFamily="Arial">Configuration</text><text x="477" y="165" fill="#b7a4ff" fontSize="15" fontFamily="Arial" fontWeight="700">Review strategy settings</text>
    <g>
      <rect x="47" y="244" width="318" height="170" rx="22" fill="#0b0b12" stroke="#373443"/><text x="72" y="280" fill="#f8fafc" fontSize="17" fontFamily="Arial" fontWeight="700">Market watch</text>
      <g fontFamily="Arial" fontSize="13"><circle cx="84" cy="318" r="12" fill="#5b4ab3"/><text x="107" y="323" fill="#e5e3eb">EUR/USD</text><text x="306" y="323" fill="#9c99a8">View</text><path d="M72 340h267" stroke="#25242e"/>
      <circle cx="84" cy="365" r="12" fill="#c88739"/><text x="107" y="370" fill="#e5e3eb">BTC/USD</text><text x="306" y="370" fill="#9c99a8">View</text><path d="M72 389h267" stroke="#25242e"/></g>
      <rect x="389" y="244" width="324" height="170" rx="22" fill="#0b0b12" stroke="#373443"/><text x="414" y="280" fill="#f8fafc" fontSize="17" fontFamily="Arial" fontWeight="700">Recent activity</text>
      <g fontFamily="Arial" fontSize="12"><circle cx="429" cy="317" r="11" fill="#1d6b5b"/><path d="m424 317 4 4 7-8" fill="none" stroke="#a2f1d8" strokeWidth="2"/><text x="452" y="321" fill="#e5e3eb">Order status updated</text><path d="M414 341h272" stroke="#25242e"/>
      <circle cx="429" cy="365" r="11" fill="#42346d"/><path d="M429 359v12m-5-6h10" stroke="#c3b4ff" strokeWidth="2"/><text x="452" y="369" fill="#e5e3eb">Settings reviewed</text></g>
    </g>
  </svg>
);

export default ShowcaseCarousel;
