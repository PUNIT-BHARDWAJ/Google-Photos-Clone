"use client"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useState } from 'react'

const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // One retry, not the default three: lib/api already retries the
            // token refresh with backoff when the server is unreachable, and
            // every page offers "Try again" - stacking three more attempts on
            // top only delays the error state and repeats the reconnect toasts.
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
        {children}
        </QueryClientProvider>
  )
}

export default QueryProvider
