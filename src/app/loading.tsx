import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
      <Image
        src="/isotipo.png"
        alt=""
        width={72}
        height={72}
        priority
        className="animate-pulse-subtle object-contain"
      />
    </div>
  );
}
