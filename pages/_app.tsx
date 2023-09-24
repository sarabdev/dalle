import { ChakraProvider } from '@chakra-ui/react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';

import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Raleway } from 'next/font/google';

import AuthContextProvider from '../contexts/authContext';

import '@/styles/globals.css';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Raleway({ subsets: ['latin'] });

function App({ Component, pageProps }: AppProps<{}>) {
  const queryClient = new QueryClient();

  return (
    <ClerkProvider>
      <ChakraProvider>
        <AuthContextProvider>
          <div className={inter.className}>
            <Toaster />
            <QueryClientProvider client={queryClient}>
              <Component {...pageProps} />
            </QueryClientProvider>
          </div>
        </AuthContextProvider>
      </ChakraProvider>
    </ClerkProvider>
  );
}

export default appWithTranslation(App);
