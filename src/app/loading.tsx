import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-white">
      <Image
        src="/isotipo.png"
        alt=""
        width={120}
        height={120}
        priority
        className="animate-pulse-subtle object-contain"
      />
      <p className="font-body text-sm font-medium tracking-widest text-[#8094B4] uppercase">Cargando</p>
    </div>
  );
}
