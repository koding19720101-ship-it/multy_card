import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ExpressPeerServer } from 'peer';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const peerServer = ExpressPeerServer(server, { debug: true });
app.use('/peerjs', peerServer);

const CARD_TYPES = [
  { id: 'longsword', name: '롱소드', type: 'attack', value: 5, description: '데미지 5' },
  { id: 'wood_shield', name: '나무 방패', type: 'defense', value: 3, description: '방어 3' }
];

function getRandomCard() {
  const type = CARD_TYPES[Math.floor(Math.random() * CARD_TYPES.length)];
  return { ...type, uid: Math.random().toString(36).substring(2, 10) };
}

const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', (nickname) => {
    console.log('createRoom called with:', nickname);
    const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    rooms[roomId] = { host: socket.id, players: [{ id: socket.id, nickname }] };
    socket.join(roomId);
    socket.emit('roomCreated', roomId);
    io.to(roomId).emit('updatePlayers', rooms[roomId].players);
  });

  socket.on('joinRoom', (data) => {
    console.log('joinRoom called with:', data);
    const { code, nickname } = data;
    if (rooms[code]) {
      if (!rooms[code].players.some(p => p.id === socket.id)) {
        rooms[code].players.push({ id: socket.id, nickname });
        socket.join(code);
      }
      socket.emit('roomJoined', code);
      io.to(code).emit('updatePlayers', rooms[code].players);
    } else {
      socket.emit('errorMsg', '방을 찾을 수 없습니다.');
    }
  });

  socket.on('startGame', (roomId) => {
    if (rooms[roomId] && rooms[roomId].host === socket.id) {
      if (rooms[roomId].players.length > 1) {
        // 게임 상태 초기화
        rooms[roomId].gameState = {
          turnIndex: 0,
          phase: 'main', // 'main': 공격 페이즈, 'defense': 방어 대기 페이즈
          players: rooms[roomId].players.map(p => ({
            ...p,
            hp: 100,
            hand: Array.from({ length: 10 }, getRandomCard)
          })),
          currentAttack: null,
          logs: ['게임이 시작되었습니다!']
        };
        // gameStarted 시 전체 상태 전달
        io.to(roomId).emit('gameStarted', rooms[roomId].gameState);
      } else {
        socket.emit('errorMsg', '혼자서는 게임을 시작할 수 없습니다. 다른 플레이어를 기다려주세요.');
      }
    }
  });

  socket.on('playAttack', (roomId, { targetId, cardUids }) => {
    const room = rooms[roomId];
    if (!room || !room.gameState) return;
    const state = room.gameState;
    
    const attacker = state.players[state.turnIndex];
    if (attacker.id !== socket.id || state.phase !== 'main') return;

    const usedCards = attacker.hand.filter(c => cardUids.includes(c.uid));
    if (usedCards.length === 0 || usedCards.some(c => c.type !== 'attack')) return;

    // 공격자의 덱에서 카드 제거
    attacker.hand = attacker.hand.filter(c => !cardUids.includes(c.uid));
    const totalDamage = usedCards.reduce((sum, c) => sum + c.value, 0);
    const target = state.players.find(p => p.id === targetId);

    if (!target) return;

    state.currentAttack = {
      attackerId: attacker.id,
      attackerName: attacker.nickname,
      targetId: target.id,
      targetName: target.nickname,
      damage: totalDamage
    };
    
    state.phase = 'defense';
    state.logs.push(`${attacker.nickname}님이 ${target.nickname}님에게 ${totalDamage} 데미지 공격!`);
    
    io.to(roomId).emit('updateGameState', state);
  });

  socket.on('playDefense', (roomId, { cardUids }) => {
    const room = rooms[roomId];
    if (!room || !room.gameState || room.gameState.phase !== 'defense') return;
    const state = room.gameState;
    const attack = state.currentAttack;

    if (socket.id !== attack.targetId) return;

    const defender = state.players.find(p => p.id === socket.id);
    const usedCards = defender.hand.filter(c => cardUids.includes(c.uid));
    
    const totalDefense = usedCards.reduce((sum, c) => sum + (c.type === 'defense' ? c.value : 0), 0);
    
    // 방어자의 덱에서 카드 제거
    defender.hand = defender.hand.filter(c => !cardUids.includes(c.uid));

    const finalDamage = Math.max(0, attack.damage - totalDefense);
    defender.hp -= finalDamage;

    if (totalDefense > 0) {
      state.logs.push(`${defender.nickname}님이 방어력 ${totalDefense} 사용. ${finalDamage} 데미지를 입었습니다.`);
    } else {
      state.logs.push(`${defender.nickname}님이 방어를 포기하여 ${finalDamage} 데미지를 입었습니다.`);
    }

    // 사망 처리 확인
    if (defender.hp <= 0) {
      state.logs.push(`💀 ${defender.nickname}님이 사망하셨습니다!`);
    }

    // 카드 보충 (사용한 만큼 다시 10장이 되도록)
    const attacker = state.players.find(p => p.id === attack.attackerId);
    while (attacker.hand.length < 10) attacker.hand.push(getRandomCard());
    while (defender.hand.length < 10) defender.hand.push(getRandomCard());

    state.currentAttack = null;
    state.phase = 'main';
    state.turnIndex = (state.turnIndex + 1) % state.players.length;
    
    // 죽은 플레이어 턴 넘기기
    let safetyCounter = 0;
    while (state.players[state.turnIndex].hp <= 0 && safetyCounter < state.players.length) {
      state.turnIndex = (state.turnIndex + 1) % state.players.length;
      safetyCounter++;
    }

    const alivePlayers = state.players.filter(p => p.hp > 0);
    if (alivePlayers.length <= 1) {
      state.logs.push(`🎉 게임 종료! ${alivePlayers[0]?.nickname || '아무도'} 승리했습니다!`);
    } else {
      state.logs.push(`---------- ${state.players[state.turnIndex].nickname}님의 턴 ----------`);
    }

    io.to(roomId).emit('updateGameState', state);
  });

  socket.on('skipTurn', (roomId) => {
    const room = rooms[roomId];
    if (!room || !room.gameState || room.gameState.phase !== 'main') return;
    const state = room.gameState;
    const attacker = state.players[state.turnIndex];
    if (attacker.id !== socket.id) return;

    state.logs.push(`${attacker.nickname}님이 턴을 넘겼습니다.`);
    state.turnIndex = (state.turnIndex + 1) % state.players.length;
    
    let safetyCounter = 0;
    while (state.players[state.turnIndex].hp <= 0 && safetyCounter < state.players.length) {
      state.turnIndex = (state.turnIndex + 1) % state.players.length;
      safetyCounter++;
    }

    state.logs.push(`---------- ${state.players[state.turnIndex].nickname}님의 턴 ----------`);
    io.to(roomId).emit('updateGameState', state);
  });

  socket.on('registerPeerId', (roomId, peerId) => {
    socket.to(roomId).emit('userConnected', peerId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const index = room.players.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        room.players.splice(index, 1);
        io.to(roomId).emit('updatePlayers', room.players);
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else if (room.host === socket.id) {
          room.host = room.players[0].id;
          io.to(roomId).emit('hostChanged', room.host);
        }
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`백엔드 통신 서버가 포트 ${PORT} 에서 실행 중입니다. (0.0.0.0)`);
});
