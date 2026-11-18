import { useState } from "react";
import logo from "../../assets/logo/agenthub-logo.svg";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { name: "Product", href: "#product" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Agents", href: "#agents" },
    { name: "Features", href: "#features" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-paper/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] w-[calc(100%-40px)] max-w-7xl items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2.5"
          onClick={() => setMenuOpen(false)}
        >
          <img
            src={logo}
            alt="AgentHub"
            className="h-10 w-10 object-contain"
          />

          <span className="text-[21px] font-bold tracking-tight text-ink">
            Agent<span className="text-forest">Hub</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-[13px] font-medium text-stone-600 transition hover:text-ink"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/login"
            className="rounded-lg px-4 py-2.5 text-[13px] font-semibold text-stone-800 transition hover:bg-black/5 hover:text-ink"
          >
            Log in
          </a>

          <a
            href="/register"
            className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-forest to-gold px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-forest/15 transition hover:-translate-y-0.5"
          >
            Get Started
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-black/10 bg-black/5 md:hidden"
        >
          <span
            className={`h-0.5 w-5 bg-stone-500 transition ${
              menuOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`h-0.5 w-5 bg-stone-500 transition ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`h-0.5 w-5 bg-stone-500 transition ${
              menuOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="border-t border-black/10 bg-white px-5 py-5 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-stone-600 transition hover:bg-black/5 hover:text-ink"
              >
                {link.name}
              </a>
            ))}

            <div className="mt-4 flex gap-2 border-t border-black/10 pt-4">
              <a
                href="/login"
                className="flex-1 rounded-lg border border-black/10 px-4 py-2.5 text-center text-sm font-semibold text-stone-800"
              >
                Log in
              </a>

              <a
                href="/register"
                className="flex-1 rounded-lg bg-gradient-to-r from-forest to-gold px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Get Started
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
