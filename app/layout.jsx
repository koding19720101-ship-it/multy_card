import './globals.css';

export const metadata = {
  title: '멀티플레이어 게임',
  description: 'Next.js로 구축된 멀티플레이어 카드 게임',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
