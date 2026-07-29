import Logo from './Logo';

const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Company', href: '#company' },
];

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 md:px-14 py-4 sm:py-5">
      <div className="grid grid-cols-3 items-center">
        <a href="#" className="flex items-center gap-2.5 justify-self-start">
          <Logo className="w-6 h-6 text-[#191919]" />
          <span className="font-semibold text-base tracking-tight text-[#191919]">Boomerang</span>
        </a>

        <div className="hidden md:flex items-center justify-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-[#191919]/70 hover:text-[#191919] transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="#demo"
          className="justify-self-end px-5 py-2.5 bg-[#191919] text-white text-sm font-medium rounded-lg hover:bg-[#191919]/90 transition-colors duration-200"
        >
          Book A Demo
        </a>
      </div>
    </nav>
  );
}
