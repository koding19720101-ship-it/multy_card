/** @type {import('next').NextConfig} */
const nextConfig = {
  // 모바일/다른 기기에서 접속 시 Next.js dev 리소스(자바스크립트 등) 차단 해제
  allowedDevOrigins: [
    '192.168.219.251',
    'localhost',
  ]
};

export default nextConfig;
