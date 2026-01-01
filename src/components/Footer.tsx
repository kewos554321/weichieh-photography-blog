import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-stone-200/50 py-6 md:py-8 px-4 md:px-6 bg-[#f7f5f2]/80">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm tracking-wider text-stone-400">
        <p>© 2024 WeiChieh Photography</p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-[#5a8a87] transition-colors duration-500">
            Instagram
          </Link>
          <Link href="#" className="hover:text-[#5a8a87] transition-colors duration-500">
            Email
          </Link>
        </div>
      </div>
    </footer>
  );
}
