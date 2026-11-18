function Footer() {
  const productLinks = [
    { name: "Workspace", href: "#product" },
    { name: "Agents", href: "#agents" },
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
  ];

  const accountLinks = [
    { name: "Log in", href: "/login" },
    { name: "Get Started", href: "/register" },
  ];

  return (
    <footer className="border-t border-black/10 bg-paper-deep px-5 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr] lg:py-14">
          {/* Brand */}
          <div className="max-w-sm">
            <a href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-forest to-gold text-sm font-bold text-white">
                ◎
              </div>
              <span className="text-lg font-bold tracking-tight text-ink">
                Agent<span className="text-forest">Hub</span>
              </span>
            </a>

            <p className="mt-4 text-sm leading-6 text-stone-500">
              A multi-agent AI workspace for turning complex software tasks into
              coordinated, testable workflows.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
              Product
            </p>

            <div className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block w-fit text-sm text-stone-500 transition hover:text-ink"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
              Account
            </p>

            <div className="mt-4 space-y-3">
              {accountLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block w-fit text-sm text-stone-500 transition hover:text-ink"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-black/5 py-6 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AgentHub. All rights reserved.</p>

          <div className="flex gap-5">
            <a href="#" className="transition hover:text-stone-800">
              Privacy
            </a>
            <a href="#" className="transition hover:text-stone-800">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
