import { ArrowRight } from 'lucide-react';

interface FeatureRowProps {
  number: string;
  label: string;
}

export default function FeatureRow({ number, label }: FeatureRowProps) {
  return (
    <a
      href="#"
      className="group bg-[#F4F3F3] hover:bg-[#eaeaea] transition-all duration-200 cursor-pointer px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between"
    >
      <span>
        <span className="text-[#191919]/40">{number}</span>
        <span className="mx-2 text-[#191919]/30">/</span>
        <span className="font-medium">{label}</span>
      </span>
      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all duration-200" />
    </a>
  );
}
