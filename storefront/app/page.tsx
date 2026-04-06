import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h1 className="text-4xl font-bold text-slate-900">Featured Products</h1>
      <p className="text-slate-600 mb-8 mt-2">Test the AI Assistant functionality on these pages.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        <Link href="/product/nemo-hornet-osmo-2" className="block bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition-all">
          <h3 className="font-semibold text-lg text-slate-900">Nemo Hornet Osmo 2P</h3>
        </Link>
        <Link href="/product/thermarest-neoair-xLite-nxt" className="block bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition-all">
          <h3 className="font-semibold text-lg text-slate-900">Therm-a-Rest NeoAir XLite NXT</h3>
        </Link>
      </div>
    </div>
  );
}
