'use client';

import dynamic from 'next/dynamic';

// Dynamically import the WalletConnect component with SSR disabled
const WalletConnect = dynamic(
  () => import('./wallet-connect'),
  { ssr: false }
);

export default WalletConnect;
