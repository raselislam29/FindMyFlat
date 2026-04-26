import dynamic from 'next/dynamic';

export const RentalsMap = dynamic(
  () => import('./Map').then((mod) => mod.RentalsMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center animate-pulse text-gray-400">Loading map...</div> }
);

export const MapPicker = dynamic(
  () => import('./Map').then((mod) => mod.MapPicker),
  { ssr: false, loading: () => <div className="w-full h-[250px] bg-gray-100 animate-pulse rounded-lg border border-gray-200"></div> }
);

export const SingleRentalMap = dynamic(
  () => import('./Map').then((mod) => mod.SingleRentalMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center animate-pulse text-gray-400">Loading map...</div> }
);
