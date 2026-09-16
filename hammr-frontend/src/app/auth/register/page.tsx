import Link from 'next/link';

import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f3]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Register */}
        <section className="order-2 flex items-center justify-center px-5 py-12 sm:px-8 lg:order-1">
          <RegisterForm />
        </section>

        {/* Branding */}
        <section className="relative order-1 hidden overflow-hidden bg-black lg:order-2 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

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
              One marketplace. Two ways to play.
            </p>

            <h2 className="text-5xl font-black leading-[1.05] tracking-tight text-white xl:text-6xl">
              Buy.
              <br />
              Sell.
              <br />
              Compete.
            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-gray-400">
              Become a buyer and compete in live auctions,
              or become a seller and put your products in
              front of bidders.
            </p>

            <div className="mt-10 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl">🛒</p>

                <p className="mt-3 text-sm font-bold text-white">
                  Buyers
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Discover and bid.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl">🏷️</p>

                <p className="mt-3 text-sm font-bold text-white">
                  Sellers
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  List and sell.
                </p>
              </div>
            </div>
          </div>

          <div className="relative p-12 pt-0 text-xs text-gray-600">
            © 2026 Hammr
          </div>
        </section>
      </div>
    </main>
  );
}