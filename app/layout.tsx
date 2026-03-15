import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nuuru',
  description: 'Hub digital pour la communauté musulmane',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
