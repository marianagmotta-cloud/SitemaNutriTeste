import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Diário Escolar Eletrônico | Gestão Acadêmica',
  description: 'Sistema de Diário Escolar Eletrônico com Vercel Postgres e GitHub integration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
