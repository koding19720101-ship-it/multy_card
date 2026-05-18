// Nostr 릴레이 서버 연결 테스트
import WebSocket from 'ws';

const relays = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://nostr.wine',
  'wss://relay.nostr.band',
  'wss://nostr-pub.wellorder.net',
  'wss://relay.current.fyi',
];

console.log('🔍 Nostr 릴레이 서버 연결 테스트 시작...\n');

const results = [];
const promises = relays.map(url => {
  return new Promise((resolve) => {
    const start = Date.now();
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => {
      ws.terminate();
      results.push({ url, ok: false, reason: 'timeout (5s)' });
      resolve();
    }, 5000);

    ws.on('open', () => {
      clearTimeout(timeout);
      const ms = Date.now() - start;
      results.push({ url, ok: true, ms });
      ws.close();
      resolve();
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      results.push({ url, ok: false, reason: err.message });
      resolve();
    });
  });
});

await Promise.all(promises);

console.log('결과:\n');
let workingCount = 0;
for (const r of results) {
  if (r.ok) {
    console.log(`  ✅ ${r.url} (${r.ms}ms)`);
    workingCount++;
  } else {
    console.log(`  ❌ ${r.url} → ${r.reason}`);
  }
}

console.log(`\n총 ${relays.length}개 중 ${workingCount}개 연결 성공`);
if (workingCount === 0) {
  console.log('\n⚠️ 모든 릴레이가 차단됨! 다른 방식 필요.');
} else {
  console.log('\n✅ 릴레이 연결 가능 → Nostr P2P 방식 정상 동작 예상');
}
