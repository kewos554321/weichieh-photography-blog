import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--card-border)]/50 pt-6 md:pt-8 pb-24 md:pb-8 px-4 md:px-6 bg-[var(--background)]/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm tracking-wider text-[var(--text-muted)]">
        <p>© 2024 WeiChieh Photography</p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-[var(--accent-teal)] transition-colors duration-500">
            Instagram
          </Link>
          <Link href="#" className="hover:text-[var(--accent-teal)] transition-colors duration-500">
            Email
          </Link>
        </div>
      </div>
    </footer>
  );
}
