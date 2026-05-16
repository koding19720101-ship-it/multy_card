'use client';

import { useEffect, useState, useRef } from 'react';

// 클라이언트 사이드 체크를 위한 헬퍼
const isClient = typeof window !== 'undefined';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [peer, setPeer] = useState(null);
  const [myPeerId, setMyPeerId] = useState('');
  
  const [screen, setScreen] = useState('home');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  
  const [amIHost, setAmIHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [selectedCardUids, setSelectedCardUids] = useState([]);
  const [targetPlayerId, setTargetPlayerId] = useState(null);

  const playersRef = useRef([]);
  const gameStateRef = useRef(null);
  const connectionsRef = useRef({}); 
  const hostConnRef = useRef(null);
  const logsEndRef = useRef(null);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const CARD_TYPES = [
    { id: 'longsword', name: '롱소드', type: 'attack', value: 5, description: '가장 기본적인\n날카로운 검', icon: '⚔️' },
    { id: 'wood_shield', name: '나무 방패', type: 'defense', value: 3, description: '투박하지만\n믿음직한 방패', icon: '🛡️' },
    { id: 'mace', name: '메이스', type: 'attack', value: 10, description: '묵직한 한 방으로\n뼈를 부숩니다', icon: '🔨' },
    { id: 'spear', name: '창', type: 'attack', value: 7, description: '거리를 유지하며\n급소를 찌릅니다', icon: '🔱' },
    { id: 'leather_gloves', name: '가죽 장갑', type: 'defense', value: 3, description: '움직임이 편한\n방어용 장갑', icon: '🧤' },
    { id: 'orbit_shift', name: '궤도변환', type: 'defense', value: 0, description: '공격의 궤도를\n바꾸어 반사함', icon: '🌀' },
    { id: 'double_edged', name: '양날검', type: 'attack', value: 8, description: '강력하지만\n사용자도 다침', icon: '🗡️' },
    { id: 'knight_helmet', name: '기사의 투구', type: 'defense', value: 5, description: '기사의 명예가\n담긴 단단한 투구', icon: '🪖' },
    { id: 'dark_cloud', name: '먹구름', type: 'attack', value: 5, description: '모두를 감전시켜\n행동을 제약함', icon: '☁️', isAOE: true },
    { id: 'black_hole', name: '블랙홀', type: 'defense', value: 0, description: '적중 시 반격하고\n모든 카드를 교체', icon: '🕳️' },
    { id: 'axe', name: '도끼', type: 'attack', value: 8, description: '매우 위협적인\n투박한 도끼', icon: '🪓' }
  ];

  const getRandomCard = () => {
    const type = CARD_TYPES[Math.floor(Math.random() * CARD_TYPES.length)];
    return { ...type, uid: Math.random().toString(36).substring(2, 10) };
  };

  useEffect(() => {
    setMounted(true);
    if (!isClient) return;

    let currentPeer = null;
    // PeerJS를 클라이언트 사이드에서만 동적 로드
    const initPeer = async () => {
      try {
        const { default: Peer } = await import('peerjs');
        const newPeer = new Peer();
        newPeer.on('open', (id) => setMyPeerId(id));
        newPeer.on('connection', (conn) => setupConnection(conn));
        newPeer.on('error', (err) => console.error('Peer error:', err));
        setPeer(newPeer);
        currentPeer = newPeer;
      } catch (e) {
        console.error('Failed to load PeerJS:', e);
      }
    };

    initPeer();
    return () => { if (currentPeer) currentPeer.destroy(); };
  }, []);

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [gameState?.logs]);

  const setupConnection = (conn) => {
    conn.on('open', () => {
      connectionsRef.current[conn.peer] = conn;
      if (!amIHost && conn.peer === roomCode.trim()) hostConnRef.current = conn;
    });
    conn.on('data', (data) => handleData(conn.peer, data));
  };

  const handleData = (senderPeerId, msg) => {
    if (!msg) return;
    switch (msg.type) {
      case 'JOIN_REQUEST':
        const nextPlayers = [...playersRef.current, { id: senderPeerId, nickname: msg.nickname, hp: 100, status: null }];
        setPlayers(nextPlayers);
        setTimeout(() => broadcast({ type: 'PLAYER_LIST_UPDATE', players: nextPlayers }), 100);
        break;
      case 'PLAYER_LIST_UPDATE':
        setPlayers(msg.players || []);
        if (screen === 'home') setScreen('lobby');
        break;
      case 'GAME_START':
      case 'GAME_STATE_UPDATE':
        setGameState(msg.gameState);
        if (msg.type === 'GAME_START') setScreen('game');
        break;
      case 'ACTION_ATTACK':
        if (gameStateRef.current) processAttack(senderPeerId, msg.data);
        break;
      case 'ACTION_DEFENSE':
        if (gameStateRef.current) processDefense(senderPeerId, msg.data);
        break;
      case 'ACTION_SKIP':
        if (gameStateRef.current) processSkip(senderPeerId);
        break;
    }
  };

  const broadcast = (data) => {
    Object.values(connectionsRef.current).forEach(conn => { if (conn.open) conn.send(data); });
  };

  const sendToHost = (data) => {
    if (hostConnRef.current?.open) hostConnRef.current.send(data);
  };

  const processAttack = (attackerId, { targetId, cardUids }) => {
    if (!gameStateRef.current) return;
    const newState = JSON.parse(JSON.stringify(gameStateRef.current));
    const attacker = newState.players.find(p => p.id === attackerId);
    if (!attacker || attacker.status === 'shock') return;

    const darkCloud = attacker.hand.find(c => c.uid === cardUids[0] && c.id === 'dark_cloud');
    if (darkCloud) {
      newState.logs.push(`⚡ ${attacker.nickname}님이 '먹구름' 시전!`);
      newState.players.forEach(p => {
        if (p.id !== attackerId && p.hp > 0) {
          p.hp = Math.max(0, p.hp - 5);
          p.status = 'shock';
          if (p.hp <= 0) newState.logs.push(`💀 ${p.nickname}님이 사망하셨습니다.`);
        }
      });
      attacker.hand = attacker.hand.filter(c => c.uid !== cardUids[0]);
      while (attacker.hand.length < 10) attacker.hand.push(getRandomCard());
      nextTurn(newState); setGameState(newState); broadcast({ type: 'GAME_STATE_UPDATE', gameState: newState });
      return;
    }

    const target = newState.players.find(p => p.id === targetId);
    if (!target) return;
    const usedCards = attacker.hand.filter(c => cardUids.includes(c.uid));
    const totalDamage = usedCards.reduce((sum, c) => sum + (c.type === 'attack' ? c.value : 0), 0);
    attacker.hand = attacker.hand.filter(c => !cardUids.includes(c.uid));
    
    if (attackerId === targetId) {
      attacker.hp = Math.max(0, attacker.hp - totalDamage);
      newState.logs.push(`💥 ${attacker.nickname}님이 자기 자신을 공격! ${totalDamage} 피해.`);
      while (attacker.hand.length < 10) attacker.hand.push(getRandomCard());
      nextTurn(newState); setGameState(newState); broadcast({ type: 'GAME_STATE_UPDATE', gameState: newState });
      return;
    }

    newState.currentAttack = { attackerId, attackerName: attacker.nickname, targetId, targetName: target.nickname, damage: totalDamage, hasDoubleEdged: usedCards.some(c => c.id === 'double_edged') };
    newState.phase = 'defense';
    newState.logs.push(`${attacker.nickname} ⚔️ ${target.nickname} (공격력 ${totalDamage})`);
    setGameState(newState); broadcast({ type: 'GAME_STATE_UPDATE', gameState: newState });
  };

  const processDefense = (defenderId, { cardUids, newTargetId }) => {
    if (!gameStateRef.current) return;
    const newState = JSON.parse(JSON.stringify(gameStateRef.current));
    const attack = newState.currentAttack;
    const defender = newState.players.find(p => p.id === defenderId);
    if (!defender || !attack) return;
    
    const usedCards = defender.hand.filter(c => cardUids.includes(c.uid));
    const orbitShiftCard = usedCards.find(c => c.id === 'orbit_shift');
    if (orbitShiftCard && newTargetId) {
      const newT = newState.players.find(p => p.id === newTargetId);
      if (newT) {
        newState.logs.push(`🌀 ${defender.nickname}님의 궤도변환! 타겟: ${newT.nickname}`);
        newState.currentAttack.attackerId = defenderId;
        newState.currentAttack.targetId = newTargetId;
        newState.currentAttack.targetName = newT.nickname;
        defender.hand = defender.hand.filter(c => !cardUids.includes(c.uid));
        while (defender.hand.length < 10) defender.hand.push(getRandomCard());
        setGameState(newState); broadcast({ type: 'GAME_STATE_UPDATE', gameState: newState });
        return;
      }
    }

    const totalDefense = usedCards.reduce((sum, c) => sum + (c.type === 'defense' ? c.value : 0), 0);
    const hasBlackHole = usedCards.some(c => c.id === 'black_hole');
    defender.hand = defender.hand.filter(c => !cardUids.includes(c.uid));
    
    let finalDamage = Math.max(0, attack.damage - totalDefense);
    if (hasBlackHole && finalDamage > 0) {
      const attacker = newState.players.find(p => p.id === attack.attackerId);
      if (attacker) attacker.hp = Math.max(0, attacker.hp - 100);
      newState.players.forEach(p => p.hand = Array.from({ length: 10 }, getRandomCard));
      newState.logs.push(`🌀 블랙홀 발동! 모두의 카드 교체 및 공격자 피해!`);
    }

    defender.hp = Math.max(0, defender.hp - finalDamage);
    newState.logs.push(`${defender.nickname} 🛡️ 방어 ${totalDefense}. 피해 ${finalDamage}.`);
    
    if (attack.hasDoubleEdged && finalDamage > 0) {
      const attacker = newState.players.find(p => p.id === attack.attackerId);
      if (attacker) attacker.hp = Math.max(0, attacker.hp - finalDamage);
    }

    const originalAttacker = newState.players.find(p => p.id === attack.attackerId);
    if (originalAttacker) while (originalAttacker.hand.length < 10) originalAttacker.hand.push(getRandomCard());
    while (defender.hand.length < 10) defender.hand.push(getRandomCard());

    newState.currentAttack = null; newState.phase = 'main';
    nextTurn(newState); setGameState(newState); broadcast({ type: 'GAME_STATE_UPDATE', gameState: newState });
  };

  const processSkip = (playerId) => {
    if (!gameStateRef.current) return;
    const newState = JSON.parse(JSON.stringify(gameStateRef.current));
    const player = newState.players.find(p => p.id === playerId);
    if (player && player.status === 'shock') player.status = null;
    nextTurn(newState); setGameState(newState); broadcast({ type: 'GAME_STATE_UPDATE', gameState: newState });
  };

  const nextTurn = (state) => {
    state.turnIndex = (state.turnIndex + 1) % state.players.length;
    let s = 0; while (state.players[state.turnIndex].hp <= 0 && s < state.players.length) { state.turnIndex = (state.turnIndex + 1) % state.players.length; s++; }
    if (state.players.filter(p => p.hp > 0).length <= 1) {
      state.phase = 'gameover';
    }
  };

  const handleCreateRoom = () => { if (!nickname) return; setAmIHost(true); setPlayers([{ id: myPeerId, nickname, hp: 100, status: null }]); setScreen('lobby'); };
  const handleJoinRoom = () => { if (!nickname || !roomCode) return; const c = peer.connect(roomCode.trim()); setupConnection(c); c.on('open', () => c.send({ type: 'JOIN_REQUEST', nickname })); };
  const handleStartGame = () => {
    const s = { turnIndex: 0, phase: 'main', players: players.map(p => ({ ...p, hand: Array.from({ length: 10 }, getRandomCard) })), currentAttack: null, logs: ['전투 시작!'] };
    setGameState(s); setScreen('game'); broadcast({ type: 'GAME_START', gameState: s, players });
  };

  const myState = gameState?.players.find(p => p.id === myPeerId);
  const isMyTurn = gameState && gameState.players[gameState.turnIndex].id === myPeerId;
  const isTarget = gameState?.currentAttack?.targetId === myPeerId;

  if (!mounted) return null;

  return (
    <div className={screen === 'game' ? 'game-container' : 'card'}>
      <style jsx global>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {screen === 'home' && (
        <div style={{ padding: '3rem 1rem' }}>
          <h1 style={{ fontSize: '2.5rem' }}>MULTY-CARD</h1>
          <div style={{ maxWidth: '320px', margin: '0 auto' }}>
            <input type="text" placeholder="사용할 닉네임" value={nickname} onChange={e => setNickname(e.target.value)} />
            <button onClick={handleCreateRoom} style={{ marginBottom: '1rem' }}>새 방 만들기</button>
            <input type="text" placeholder="방 코드 (Host ID)" value={roomCode} onChange={e => setRoomCode(e.target.value)} />
            <button onClick={handleJoinRoom} style={{ background: '#64748b' }}>방 참가하기</button>
          </div>
        </div>
      )}

      {screen === 'lobby' && (
        <div style={{ padding: '2rem' }}>
          <h1>대기실</h1>
          <p>내 코드: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{myPeerId}</span></p>
          <ul>{players.map(p => <li key={p.id}>{p.nickname}</li>)}</ul>
          {amIHost ? <button onClick={handleStartGame}>게임 시작</button> : <p>호스트 대기 중...</p>}
        </div>
      )}

      {screen === 'game' && gameState && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '90vh', gap: '1rem' }}>
          <div style={{ display: 'flex', flex: 1, gap: '1rem', minHeight: 0 }}>
            <div className="game-logs" style={{ flex: 1, overflowY: 'auto' }}>
              {gameState.logs.map((l, i) => <div key={i}>{l}</div>)}
              <div ref={logsEndRef}></div>
            </div>
            <div style={{ width: '280px', display: 'flex', flexDirection: 'column' }}>
              <h2>참가자 현황</h2>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {gameState.players.map(p => (
                  <div key={p.id} className={`player-item ${targetPlayerId === p.id ? 'target-selected' : ''}`} 
                    onClick={() => p.hp > 0 && setTargetPlayerId(p.id)} >
                    <div style={{ fontWeight: 'bold' }}>{p.nickname} ({p.hp} HP)</div>
                    <div className="hp-bar"><div className={`hp-fill ${p.hp < 30 ? 'low' : ''}`} style={{ width: `${p.hp}%` }}></div></div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {isMyTurn && gameState.phase === 'main' && (
                  <>
                    <button onClick={() => {
                      const data = { targetId: targetPlayerId, cardUids: selectedCardUids };
                      if (amIHost) processAttack(myPeerId, data); else sendToHost({ type: 'ACTION_ATTACK', data });
                      setSelectedCardUids([]); setTargetPlayerId(null);
                    }} style={{ background: '#ef4444' }}>공격하기</button>
                    <button onClick={() => { if (amIHost) processSkip(myPeerId); else sendToHost({ type: 'ACTION_SKIP' }); }} style={{ background: '#64748b' }}>턴 넘기기</button>
                  </>
                )}
                {gameState.phase === 'defense' && isTarget && (
                  <button onClick={() => {
                    const data = { cardUids: selectedCardUids, newTargetId: targetPlayerId };
                    if (amIHost) processDefense(myPeerId, data); else sendToHost({ type: 'ACTION_DEFENSE', data });
                    setSelectedCardUids([]); setTargetPlayerId(null);
                  }} style={{ background: '#3b82f6' }}>방어 / 받기</button>
                )}
              </div>
            </div>
          </div>
          <div className="hand-container" style={{ height: '240px', flexShrink: 0 }}>
            {myState?.hand.map(c => (
              <div key={c.uid} className={`playing-card type-${c.type} ${selectedCardUids.includes(c.uid) ? 'selected' : ''}`} 
                onClick={() => setSelectedCardUids(prev => prev.includes(c.uid) ? prev.filter(id => id !== c.uid) : [...prev, c.uid])} >
                <div style={{ fontSize: '1.5rem' }}>{c.icon}</div>
                <div style={{ fontWeight: 'bold' }}>{c.name}</div>
                <div style={{ fontSize: '0.7rem' }}>{c.description}</div>
                <div style={{ marginTop: 'auto' }}>{c.value > 0 ? c.value : '-'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
