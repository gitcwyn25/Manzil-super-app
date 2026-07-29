import BoomerangVideoBg from './BoomerangVideoBg';
import FeatureRow from './FeatureRow';

const FEATURES = [
  { number: '01', label: 'Conversational' },
  { number: '02', label: 'Connected' },
  { number: '03', label: 'Compliant' },
];

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center overflow-hidden h-screen">
      <BoomerangVideoBg />

      {/* Hero copy */}
      <div className="relative z-10 flex flex-col items-center text-center pt-24 sm:pt-26 md:pt-32 px-4 sm:px-6">
        <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[1.1] tracking-tighter text-[#191919] font-normal">
          Build lasting
          <br />
          relationships.
        </h1>

        <p className="max-w-sm sm:max-w-md mt-5 sm:mt-6 md:mt-8 text-sm md:text-base text-[#191919]/70 leading-relaxed">
          Conversational AI platform for modern financial institutions — agents that handle the
          full borrower lifecycle across email, SMS, and voice.
        </p>

        <a
          href="#demo"
          className="mt-6 sm:mt-8 md:mt-10 px-6 sm:px-8 py-3 sm:py-3.5 bg-[#191919] text-white text-sm font-medium rounded-lg hover:bg-[#191919]/90 transition-colors duration-200"
        >
          Book A Demo
        </a>
      </div>

      {/* Bottom info panel */}
      <div className="relative z-10 mt-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200 border-b-0 pt-8 sm:pt-12 md:pt-16 px-5 sm:px-8 md:px-12 pb-0 shadow-sm">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-16">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#191919]/50 font-medium">
                WHAT DO WE DO?
              </p>
              <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-serif font-normal leading-tight tracking-tight">
                Conversations that
                <br className="hidden sm:block" />
                build momentum
              </h2>
            </div>
            <div className="flex items-end">
              <p className="text-sm md:text-[15px] text-[#191919]/70 leading-relaxed">
                Conversational AI built for regulated financial institutions. Agents that hold a
                real conversation, plug into the systems you run, and show their work.
              </p>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 md:mt-10 h-px bg-gray-200 w-full" />

          <div className="mt-6 sm:mt-8 md:mt-10 grid sm:grid-cols-3 gap-2 sm:gap-3">
            {FEATURES.map((feature) => (
              <FeatureRow key={feature.number} number={feature.number} label={feature.label} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
