'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ActivarPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/cuenta/login'); }, [router]);
  return null;
}
