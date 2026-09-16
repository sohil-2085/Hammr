import Link from 'next/link';

import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f3]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left branding panel */}
        <section className="relative hidden overflow-hidden bg-black lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

          <div className="relative p-12">
            <Link
              href="/"
              className="inline-flex items-center gap-3"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-black text-black">
                H
              </span>

              <span className="text-2xl font-black tracking-tight text-white">
                Hammr
              </span>
            </Link>
          </div>

          <div className="relative max-w-xl p-12 pb-20">
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.25em] text-gray-400">
              The auction marketplace
            </p>

            <h2 className="text-5xl font-black leading-[1.05] tracking-tight text-white xl:text-6xl">
              Bid smart.
              <br />
              Win big.
            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-gray-400">
              Discover unique products, follow live auctions,
              and compete in real time on Hammr.
            </p>

            <div className="mt-10 flex gap-3">
              <div className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-gray-300">
                Live auctions
              </div>

              <div className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-gray-300">
                Real-time bidding
              </div>
            </div>
          </div>

          <div className="relative p-12 pt-0 text-xs text-gray-600">
            © 2026 Hammr
          </div>
        </section>

        {/* Login */}
        <section className="flex items-center justify-center px-5 py-12 sm:px-8">
          <LoginForm />
        </section>
      </div>
    </main>
  );
}