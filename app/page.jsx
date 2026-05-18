'use client';

import { useEffect, useState, useRef } from 'react';

export default function Home() {
  const [myPeerId, setMyPeerId] = useState('');
  
  const [screen, setScreen] = useState('home');
  const [connectingMsg, setConnectingMsg] = useState('');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  
  const [amIHost, setAmIHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [selectedCardUids, setSelectedCardUids] = useState([]);
  const [targetPlayerId, setTargetPlayerId] = useState(null);
  const [displayRoomCode, setDisplayRoomCode] = useState('');

  const playersRef = useRef([]);
  const gameStateRef = useRef(null);
  const logsEndRef = useRef(null);

  const handRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragDistance = useRef(0);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const CARD_TYPES = [
    { id: 'longsword', name: '롱소드', type: 'attack', value: 5, description: '가장 기본적인\n날카로운 검', icon: '⚔️', weight: 50 },
    { id: 'wood_shield', name: '나무 방패', type: 'defense', value: 3, description: '투박하지만\n믿음직한 방패', icon: '🛡️', weight: 50 },
    { id: 'mace', name: '메이스', type: 'attack', value: 10, description: '묵직한 한 방으로\n뼈를 부숩니다', icon: '🔨', weight: 30 },
    { id: 'spear', name: '창', type: 'attack', value: 7, description: '거리를 유지하며\n급소를 찌릅니다', icon: '🔱', weight: 40 },
    { id: 'leather_gloves', name: '가죽 장갑', type: 'defense', value: 3, description: '움직임이 편한\n방어용 장갑', icon: '🧤', weight: 50 },
    { id: 'orbit_shift', name: '궤도변환', type: 'defense', value: 0, description: '공격의 궤도를\n바꾸어 반사함', icon: '🌀', weight: 20 },
    { id: 'double_edged', name: '양날검', type: 'attack', value: 8, description: '강력하지만\n사용자도 다침', icon: '🗡️', weight: 30 },
    { id: 'knight_helmet', name: '기사의 투구', type: 'defense', value: 5, description: '기사의 명예가\n담긴 단단한 투구', icon: '🪖', weight: 30 },
    { id: 'dark_cloud', name: '먹구름', type: 'attack', value: 5, description: '모두를 감전시켜\n행동을 제약함', icon: '☁️', isAOE: true, weight: 15 },
    { id: 'black_hole', name: '블랙홀', type: 'defense', value: 0, description: '적중 시 모두에게 75피해\n시공간을 뒤틀어 카드 교체', icon: '🕳️', weight: 5 },
    { id: 'axe', name: '도끼', type: 'attack', value: 8, description: '매우 위협적인\n투박한 도끼', icon: '🪓', weight: 35 },
    // 새 카드 추가
    { id: 'flashbang', name: '섬광탄', type: 'attack', value: 1, description: '1데미지, 섬광 상태 부여\n공격 시 타겟 무작위 변경', icon: '✨', weight: 25 },
    { id: 'leather_vest', name: '가죽 조끼', type: 'defense', value: 3, description: '방어력 3\n가벼운 방어구', icon: '🦺', weight: 45 },
    { id: 'bamboo_spear', name: '죽창', type: 'attack', value: 3, description: '3데미지\n방어력 50% 무시', icon: '🎍', weight: 35 },
    { id: 'iron_greaves', name: '철 각반', type: 'defense', value: 4, description: '방어력 4\n단단한 다리 보호대', icon: '🦵', weight: 35 },
    { id: 'iron_shield', name: '철제 방패', type: 'defense', value: 5, description: '방어력 5\n매우 견고한 방패', icon: '🛡️', weight: 25 },
    { id: 'claw', name: '클로', type: 'attack', value: 4, description: '4데미지\n빠르고 날카로운 공격', icon: '💅', weight: 45 },
    { id: 'god_sword', name: '신의 검', type: 'attack', value: 25, description: '25데미지\n신성한 힘이 깃든 검', icon: '⚡', weight: 2 },
    // 새 카드 추가
    { id: 'torch', name: '횃불', type: 'attack', value: 2, description: '2데미지, 화상 부여\n5턴간 매턴 2데미지', icon: '🔥', weight: 35 },
    { id: 'bandage', name: '붕대', type: 'heal', value: 5, description: '체력 5 회복\n선택 대상 치유', icon: '🩹', weight: 40 },
    { id: 'volcano', name: '화산', type: 'attack', value: 5, description: '자신 제외 모두에게\n5데미지 + 화상 부여', icon: '🌋', isAOE: true, weight: 10 },
    { id: 'berserk', name: '광폭화', type: 'buff', value: 0, description: '공격 시 1장당 데미지 1.2배\n강력한 일격을 준비함', icon: '😡', weight: 20 },
    { id: 'viper_fang', name: '독사의 송곳니', type: 'attack', value: 2, description: '2데미지, 독 부여\n7턴간 매턴 1데미지', icon: '🐍', weight: 35 },
    { id: 'blood_blast', name: '블러드 블라스트', type: 'attack', value: 0, description: '현재 체력의 50% 소모\n소모한 체력만큼 데미지', icon: '🩸', weight: 15 },
    { id: 'fishing_rod', name: '낚싯대', type: 'attack', value: 1, description: '1데미지\n상대 패에서 무작위 카드 1장 스틸', icon: '🎣', weight: 25 },
    { id: 'icicle', name: '고드름', type: 'attack', value: 3, description: '3데미지, 감기 부여\n10턴간 매턴 1데미지', icon: '❄️', weight: 35 },
    { id: 'barrier', name: '배리어', type: 'defense', value: 12, description: '12방어력\n견고한 마법 방벽', icon: '💠', weight: 30 }
  ];

  const getRandomCard = () => {
    const totalWeight = CARD_TYPES.reduce((sum, card) => sum + card.weight, 0);
    let random = Math.random() * totalWeight;
    for (const card of CARD_TYPES) {
      if (random < card.weight) {
        return { ...card, uid: Math.random().toString(36).substring(2, 10) };
      }
      random -= card.weight;
    }
    return { ...CARD_TYPES[0], uid: Math.random().toString(36).substring(2, 10) };
  };

  const mqttClientRef = useRef(null);
  const mqttTopicRef = useRef('');
  const hostIdRef = useRef(null);
  const nicknameRef = useRef('');
  const myPeerIdRef = useRef('');
  const retryIntervalRef = useRef(null);
  const isInLobbyRef = useRef(false);
  const isHostRef = useRef(false);

  useEffect(() => {
    nicknameRef.current = nickname;
  }, [nickname]);

  useEffect(() => {
    myPeerIdRef.current = myPeerId;
  }, [myPeerId]);

  const initMQTTRoom = (code, isHost) => {
    const myId = 'p' + Math.random().toString(36).substring(2, 10);
    setMyPeerId(myId);
    myPeerIdRef.current = myId;
    isHostRef.current = isHost;

    const topic = 'mcg/game/v3/' + code.toLowerCase();
    mqttTopicRef.current = topic;
    const fullRoomId = 'mcg-' + code.toLowerCase();
    setDisplayRoomCode(fullRoomId);

    if (isHost) {
      hostIdRef.current = myId;
      isInLobbyRef.current = true;
      setPlayers([{ id: myId, nickname: nicknameRef.current, hp: 100, shockDuration: 0, flashDuration: 0, burnDuration: 0, poisonDuration: 0, coldDuration: 0 }]);
      setScreen('lobby');
    } else {
      isInLobbyRef.current = false;
      setScreen('connecting');
      setConnectingMsg('서버에 연결 중...');
    }

    // 공개 MQTT 브로커 목록 (포트 443/8884 WSS - 방화벽 우회)
    const brokers = [
      'wss://broker.hivemq.com:8884/mqtt',
      'wss://broker.emqx.io:8084/mqtt',
    ];

    import('mqtt').then((mod) => {
      const mqtt = mod.default ?? mod;
      let brokerIdx = 0;

      const tryConnect = (idx) => {
        if (idx >= brokers.length) {
          alert('서버 연결 실패. 인터넷 상태를 확인해 주세요.');
          return;
        }
        console.log('MQTT 연결 시도:', brokers[idx]);
        setConnectingMsg(`서버 연결 중... (${idx + 1}/${brokers.length})`);

        if (mqttClientRef.current) { try { mqttClientRef.current.end(true); } catch(e){} }

        const client = mqtt.connect(brokers[idx], {
          clientId: 'mcg_' + myId,
          clean: true,
          connectTimeout: 8000,
          reconnectPeriod: 5000,
          will: {
            topic,
            payload: JSON.stringify({ type: 'PEER_LEAVE', senderId: myId }),
            qos: 1,
            retain: false,
          },
        });
        mqttClientRef.current = client;

        const timeout = setTimeout(() => {
          if (client.connected) return;
          client.end(true);
          tryConnect(idx + 1);
        }, 9000);

        client.on('connect', () => {
          clearTimeout(timeout);
          console.log('MQTT 연결 성공:', brokers[idx]);
          client.subscribe(topic, { qos: 1 }, (err) => {
            if (err) { console.error('구독 실패:', err); return; }
            if (!isHost) {
              setConnectingMsg('호스트에게 참가 요청 중...');
              const joinMsg = { type: 'JOIN_REQUEST', senderId: myId, nickname: nicknameRef.current };
              client.publish(topic, JSON.stringify(joinMsg), { qos: 1 });
              if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
              retryIntervalRef.current = setInterval(() => {
                if (!isInLobbyRef.current && client.connected) {
                  setConnectingMsg('참가 요청 재시도 중...');
                  client.publish(topic, JSON.stringify(joinMsg), { qos: 1 });
                } else {
                  clearInterval(retryIntervalRef.current);
                }
              }, 3000);
            }
          });
        });

        client.on('message', (t, payload) => {
          try {
            const msg = JSON.parse(payload.toString());
            if (msg.senderId === myId) return;
            console.log('수신:', msg.type, 'from', msg.senderId);
            handleMQTTData(msg);
          } catch(e) { console.error('메시지 파싱 오류', e); }
        });

        client.on('error', (err) => {
          clearTimeout(timeout);
          console.error('MQTT 오류:', err);
        });
      };

      tryConnect(0);
    }).catch(err => {
      console.error('MQTT 로드 실패:', err);
      alert('네트워크 라이브러리 로드 실패. 페이지를 새로고침해 주세요.');
    });
  };



  useEffect(() => {
    const preGeneratedId = 'mcg-' + Math.random().toString(36).substring(2, 7).toLowerCase();
    setMyPeerId(preGeneratedId);
    setDisplayRoomCode(preGeneratedId);
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) setRoomCode(roomParam.replace(/[^a-zA-Z0-9]/g, '').toLowerCase());
    return () => {
      if (mqttClientRef.current) { try { mqttClientRef.current.end(true); } catch(e){} }
      if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [gameState?.logs]);

  const handleMQTTData = (msg) => {
    const senderId = msg.senderId;
    const isHost = isHostRef.current;
    switch (msg.type) {
      case 'JOIN_REQUEST':
        if (!isHost) return;
        const alreadyJoined = playersRef.current.some(p => p.id === senderId);
        const nextPlayers = alreadyJoined
          ? playersRef.current
          : [...playersRef.current, { id: senderId, nickname: msg.nickname, hp: 100, shockDuration: 0, flashDuration: 0, burnDuration: 0, poisonDuration: 0, coldDuration: 0 }];
        if (!alreadyJoined) setPlayers(nextPlayers);
        setTimeout(() => broadcast({ type: 'PLAYER_LIST_UPDATE', players: nextPlayers, hostId: myPeerIdRef.current }), 200);
        break;
      case 'PLAYER_LIST_UPDATE':
        setPlayers(msg.players);
        if (msg.hostId) hostIdRef.current = msg.hostId;
        isInLobbyRef.current = true;
        if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
        setScreen('lobby');
        break;
      case 'GAME_START':
      case 'GAME_STATE_UPDATE':
        setGameState(msg.gameState);
        if (msg.type === 'GAME_START') setScreen('game');
        break;
      case 'ACTION_ATTACK':
        if (isHost && gameStateRef.current) processAttack(senderId, msg.data);
        break;
      case 'ACTION_DEFENSE':
        if (isHost && gameStateRef.current) processDefense(senderId, msg.data);
        break;
      case 'ACTION_SKIP':
        if (isHost && gameStateRef.current) processSkip(senderId);
        break;
      case 'PEER_LEAVE':
        if (isHost) {
          const remaining = playersRef.current.filter(p => p.id !== senderId);
          setPlayers(remaining);
          broadcast({ type: 'PLAYER_LIST_UPDATE', players: remaining, hostId: myPeerIdRef.current });
          if (gameStateRef.current) {
            const ns = JSON.parse(JSON.stringify(gameStateRef.current));
            const lp = ns.players.find(p => p.id === senderId);
            if (lp) { lp.hp = 0; ns.logs.push(`🔌 ${lp.nickname}님이 접속을 종료하여 전멸 처리.`); nextTurn(ns); setGameState(ns); broadcast({ type: 'GAME_STATE_UPDATE', gameState: ns }); }
          }
        } else if (senderId === hostIdRef.current) {
          alert('호스트와의 연결이 끊어졌습니다.'); window.location.reload();
        }
        break;
      case 'GAME_QUIT':
        alert('호스트가 방을 종료했습니다.');
        window.location.reload();
        break;
    }
  };

  const broadcast = (data) => {
    const client = mqttClientRef.current;
    const topic = mqttTopicRef.current;
    if (client && client.connected && topic) {
      const msg = { ...data, senderId: myPeerIdRef.current };
      client.publish(topic, JSON.stringify(msg), { qos: 1 });
    } else {
      console.warn('MQTT 미연결 상태');
    }
  };

  // MQTT에서는 broadcast와 sendToHost 동일 (브로커가 라우팅)
  const sendToHost = (data) => broadcast(data);

  // 게임 로직
  const processAttack = (attackerId, { targetId, cardUids }) => {
    const newState = JSON.parse(JSON.stringify(gameStateRef.current));
    const attacker = newState.players.find(p => p.id === attackerId);
    if (!attacker || attacker.shockDuration > 0) return;

    const usedCards = attacker.hand.filter(c => cardUids.includes(c.uid));
    
    // 힐 처리 (붕대)
    const healCards = usedCards.filter(c => c.type === 'heal');
    if (healCards.length > 0) {
      const target = newState.players.find(p => p.id === targetId);
      if (target) {
        const totalHeal = healCards.reduce((sum, c) => sum + c.value, 0);
        target.hp = Math.min(100, target.hp + totalHeal);
        newState.logs.push(`🩹 ${attacker.nickname}님이 ${target.nickname}님을 치유! +${totalHeal} HP.`);
        attacker.hand = attacker.hand.filter(c => !cardUids.includes(c.uid));
        while (attacker.hand.length < 10) attacker.hand.push(getRandomCard());
        nextTurn(newState); setGameState(newState); broadcast({ type: 'GAME_STATE_UPDATE', gameState: newState });
        return;
      }
    }

    // 특수 카드 및 상태 이상 처리
    const darkCloud = usedCards.find(c => c.id === 'dark_cloud');
    const flashbang = usedCards.find(c => c.id === 'flashbang');
    const torch = usedCards.find(c => c.id === 'torch');
    const volcano = usedCards.find(c => c.id === 'volcano');
    const berserkCount = usedCards.filter(c => c.id === 'berserk').length;
    const bloodBlastCount = usedCards.filter(c => c.id === 'blood_blast').length;
    const fishingRodCount = usedCards.filter(c => c.id === 'fishing_rod').length;
    const viperFang = usedCards.find(c => c.id === 'viper_fang');
    const icicle = usedCards.find(c => c.id === 'icicle');
    
    // 광역 카드 처리 (먹구름, 화산)
    const aoecard = usedCards.find(c => c.isAOE);
    if (aoecard) {
      if (aoecard.id === 'dark_cloud') {
        newState.logs.push(`⚡ ${attacker.nickname}님이 '먹구름' 시전! 모두에게 공격!`);
        const aliveOtherPlayersCount = newState.players.filter(p => p.id !== attackerId && p.hp > 0).length;
        newState.players.forEach(p => { 
          if (p.id !== attackerId && p.hp > 0) { 
            p.hp = Math.max(0, p.hp - 5); p.shockDuration = (p.shockDuration || 0) + aliveOtherPlayersCount;
            if (p.hp <= 0) newState.logs.push(`💀 ${p.nickname}님이 사망하셨습니다.`); 
          } 
        });
      } else if (aoecard.id === 'volcano') {
        newState.logs.push(`🌋 ${attacker.nickname}님이 '화산' 폭발 시전! 모두에게 공격!`);
        newState.players.forEach(p => { 
          if (p.id !== attackerId && p.hp > 0) { 
            p.hp = Math.max(0, p.hp - 5); p.burnDuration = (p.burnDuration || 0) + 5; 
            if (p.hp <= 0) newState.logs.push(`💀 ${p.nickname}님이 용암에 휩쓸려 사망했습니다.`); 
          } 
        });
      }
      attacker.hand = attacker.hand.filter(c => !cardUids.includes(c.uid));
      while (attacker.hand.length < 10) attacker.hand.push(getRandomCard());
      nextTurn(newState); setGameState(newState); broadcast({ type: 'GAME_STATE_UPDATE', gameState: newState });
      return;
    }

    // 섬광 상태 이상 처리 (타겟 무작위 변경)
    let finalTargetId = targetId;
    if (attacker.flashDuration > 0 && !flashbang) {
      const otherPlayers = newState.players.filter(p => p.id !== attackerId && p.hp > 0);
      if (otherPlayers.length > 0) {
        finalTargetId = otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id;
        newState.logs.push(`✨ ${attacker.nickname}님이 섬광 상태라 눈이 부십니다! 타겟이 변경됨.`);
      }
    }
    
    const target = newState.players.find(p => p.id === finalTargetId);
    if (!target) return;
    
    let totalDamage = usedCards.reduce((sum, c) => sum + (c.type === 'attack' ? c.value : 0), 0);
    
    if (bloodBlastCount > 0) {
      let bloodBlastDamage = 0;
      for (let i = 0; i < bloodBlastCount; i++) {
        const cost = Math.ceil(attacker.hp * 0.5);
        attacker.hp -= cost;
        bloodBlastDamage += cost;
      }
      totalDamage += bloodBlastDamage;
      newState.logs.push(`🩸 ${attacker.nickname}님이 피의 50%를 소모하여 ${bloodBlastDamage} 데미지를 추가합니다!`);
    }
    
    // 광폭화 효과: 한 장당 데미지 1.2배
    if (berserkCount > 0) {
      totalDamage = Math.floor(totalDamage * Math.pow(1.2, berserkCount));
      newState.logs.push(`😡 ${attacker.nickname}님이 광폭화 ${berserkCount}장 사용! 데미지가 증가합니다.`);
    }

    attacker.hand = attacker.hand.filter(c => !cardUids.includes(c.uid));

    if (fishingRodCount > 0 && targetId !== attackerId) {
      let stolen = 0;
      for (let i = 0; i < fishingRodCount; i++) {
        if (target.hand.length > 0) {
          const randIdx = Math.floor(Math.random() * target.hand.length);
          const card = target.hand.splice(randIdx, 1)[0];
          attacker.hand.push(card);
          stolen++;
        }
      }
      if (stolen > 0) {
        newState.logs.push(`🎣 ${attacker.nickname}님이 '낚싯대'로 ${target.nickname}님의 카드 ${stolen}장을 훔쳤습니다!`);
      }
    }

    if (attackerId === finalTargetId) {
      attacker.hp = Math.max(0, attacker.hp - totalDamage);
      newState.logs.push(`💥 ${attacker.nickname}님이 자기 자신을 공격! ${totalDamage} 피해.`);
      if (flashbang) { attacker.flashDuration = (attacker.flashDuration || 0) + 3; newState.logs.push(`✨ 스스로 '섬광탄'에 맞았습니다!`); }
      if (torch) { attacker.burnDuration = (attacker.burnDuration || 0) + 5; newState.logs.push(`🔥 스스로 '횃불'에 맞았습니다!`); }
      if (viperFang) { attacker.poisonDuration = (attacker.poisonDuration || 0) + 7; newState.logs.push(`🐍 스스로 '독사의 송곳니'에 맞았습니다!`); }
      if (icicle) { attacker.coldDuration = (attacker.coldDuration || 0) + 10; newState.logs.push(`❄️ 스스로 '고드름'에 맞았습니다!`); }
      while (attacker.hand.length < 10) attacker.hand.push(getRandomCard());
      nextTurn(newState); 
      setGameState(newState); broadcast({ type: 'GAME_STATE_UPDATE', gameState: newState });
      return;
    }
    
    newState.currentAttack = { 
      attackerId, attackerName: attacker.nickname, targetId: finalTargetId, targetName: target.nickname, 
      damage: totalDamage, 
      hasDoubleEdged: usedCards.some(c => c.id === 'double_edged'),
      hasBambooSpear: usedCards.some(c => c.id === 'bamboo_spear'),
      statusEffects: {
        flash: !!flashbang,
        burn: !!torch,
        poison: !!viperFang,
        cold: !!icicle
      }
    };
    newState.phase = 'defense';
    newState.logs.push(`${attacker.nickname} ⚔️ ${target.nickname} (공격력 ${totalDamage})`);
    setGameState(newState); broadcast({ type: 'GAME_STATE_UPDATE', gameState: newState });
  };

  const processDefense = (defenderId, { cardUids, newTargetId }) => {
    const newState = JSON.parse(JSON.stringify(gameStateRef.current));
    const attack = newState.currentAttack;
    if (!attack) return;
    const defender = newState.players.find(p => p.id === defenderId);
    const usedCards = defender.hand.filter(c => cardUids.includes(c.uid));
    const orbitShiftCard = usedCards.find(c => c.id === 'orbit_shift');
    if (orbitShiftCard && newTargetId) {
      newState.logs.push(`🌀 ${defender.nickname}님의 궤도변환! 타겟: ${newState.players.find(p => p.id === newTargetId).nickname}`);
      newState.currentAttack.attackerId = defenderId;
      newState.currentAttack.attackerName = defender.nickname;
      newState.currentAttack.targetId = newTargetId;
      newState.currentAttack.targetName = newState.players.find(p => p.id === newTargetId).nickname;
      defender.hand = defender.hand.filter(c => !cardUids.includes(c.uid));
      while (defender.hand.length < 10) defender.hand.push(getRandomCard());
      setGameState(newState); broadcast({ type: 'GAME_STATE_UPDATE', gameState: newState });
      return;
    }
    const totalDefense = usedCards.reduce((sum, c) => sum + (c.type === 'defense' ? c.value : 0),0);
    const hasBlackHole = usedCards.some(c => c.id === 'black_hole');
    defender.hand = defender.hand.filter(c => !cardUids.includes(c.uid));

    let finalDefense = totalDefense;
    // 죽창 효과: 방어력 50% 무시 (올림)
    if (attack.hasBambooSpear) {
      finalDefense = Math.floor(totalDefense * 0.5);
      newState.logs.push(`🎍 죽창이 방어력을 뚫습니다! (방어력 50% 무시)`);
    }

    let finalDamage = Math.max(0, attack.damage - finalDefense);
    if (hasBlackHole && finalDamage > 0) {
      newState.logs.push(`🕳️ 블랙홀 폭발! 모두에게 75의 피해를 입히고 시공간이 뒤틀립니다!`);
      newState.players.forEach(p => { if (p.hp > 0) { p.hp = Math.max(0, p.hp - 75); p.hand = Array.from({ length: 10 }, getRandomCard); if (p.hp <= 0) newState.logs.push(`💀 ${p.nickname}님이 블랙홀에 휩쓸려 사망했습니다.`); } });
      finalDamage = 0; 
    } else { 
      defender.hp = Math.max(0, defender.hp - finalDamage); 
      newState.logs.push(`${defender.nickname} 🛡️ 방어 ${finalDefense}. 피해 ${finalDamage}.`); 
      
      if (finalDamage > 0 && attack.statusEffects) {
        if (attack.statusEffects.flash) {
          defender.flashDuration = (defender.flashDuration || 0) + 3;
          newState.logs.push(`✨ ${defender.nickname}님의 섬광 지속시간이 증가합니다.`);
        }
        if (attack.statusEffects.burn) {
          defender.burnDuration = (defender.burnDuration || 0) + 5;
          newState.logs.push(`🔥 ${defender.nickname}님의 화상 지속시간이 증가합니다.`);
        }
        if (attack.statusEffects.poison) {
          defender.poisonDuration = (defender.poisonDuration || 0) + 7;
          newState.logs.push(`🐍 ${defender.nickname}님이 중독됩니다.`);
        }
        if (attack.statusEffects.cold) {
          defender.coldDuration = (defender.coldDuration || 0) + 10;
          newState.logs.push(`❄️ ${defender.nickname}님이 감기에 걸립니다.`);
        }
      } else if (finalDamage === 0 && attack.statusEffects && (attack.statusEffects.flash || attack.statusEffects.burn || attack.statusEffects.poison || attack.statusEffects.cold)) {
        newState.logs.push(`🛡️ ${defender.nickname}님이 완벽히 방어하여 상태이상을 무효화했습니다!`);
      }
    }
    if (attack.hasDoubleEdged && finalDamage > 0) { const attacker = newState.players.find(p => p.id === attack.attackerId); if (attacker) attacker.hp = Math.max(0, attacker.hp - finalDamage); }
    const originalAttacker = newState.players.find(p => p.id === attack.attackerId);
    if (originalAttacker) while (originalAttacker.hand.length < 10) originalAttacker.hand.push(getRandomCard());
    while (defender.hand.length < 10) defender.hand.push(getRandomCard());
    newState.currentAttack = null; newState.phase = 'main';
    nextTurn(newState); 
    setGameState(newState); 
    broadcast({ type: 'GAME_STATE_UPDATE', gameState: newState });
  };

  const processSkip = (playerId) => { 
    const newState = JSON.parse(JSON.stringify(gameStateRef.current)); 
    const player = newState.players.find(p => p.id === playerId); 
    // 턴을 넘기면 섬광 상태 해제
    if (player.flashDuration > 0) {
      player.flashDuration = 0;
      newState.logs.push(`✨ ${player.nickname}님의 섬광 상태가 해제되었습니다.`);
    }
    nextTurn(newState); 
    setGameState(newState); 
    broadcast({ type: 'GAME_STATE_UPDATE', gameState: newState }); 
  };
  const nextTurn = (state) => {
    // 1. 현재 플레이어의 상태 업데이트 (감전, 섬광, 화상 등)
    const currentPlayer = state.players[state.turnIndex];
    
    // 감전 처리
    if (currentPlayer.shockDuration > 0) {
      currentPlayer.shockDuration -= 1;
      if (currentPlayer.shockDuration <= 0) {
        state.logs.push(`⚡ ${currentPlayer.nickname}님의 감전이 해제되었습니다.`);
      }
    }
    
    // 섬광 처리
    if (currentPlayer.flashDuration > 0) {
      currentPlayer.flashDuration -= 1;
      if (currentPlayer.flashDuration <= 0) {
        state.logs.push(`✨ ${currentPlayer.nickname}님의 섬광 상태가 해제되었습니다.`);
      }
    }

    // 화상 처리 (턴 시작 시 2데미지)
    if (currentPlayer.burnDuration > 0) {
      currentPlayer.hp = Math.max(0, currentPlayer.hp - 2);
      currentPlayer.burnDuration -= 1;
      state.logs.push(`🔥 ${currentPlayer.nickname}님이 화상으로 2데미지를 입었습니다. (남은 지속: ${currentPlayer.burnDuration}턴)`);
      if (currentPlayer.hp <= 0) {
        state.logs.push(`💀 ${currentPlayer.nickname}님이 화상으로 사망하셨습니다.`);
      } else if (currentPlayer.burnDuration <= 0) {
        state.logs.push(`🔥 ${currentPlayer.nickname}님의 화상이 치유되었습니다.`);
      }
    }

    // 독 처리 (턴 시작 시 1데미지)
    if (currentPlayer.hp > 0 && currentPlayer.poisonDuration > 0) {
      currentPlayer.hp = Math.max(0, currentPlayer.hp - 1);
      currentPlayer.poisonDuration -= 1;
      state.logs.push(`🐍 ${currentPlayer.nickname}님이 독으로 1데미지를 입었습니다. (남은 지속: ${currentPlayer.poisonDuration}턴)`);
      if (currentPlayer.hp <= 0) {
        state.logs.push(`💀 ${currentPlayer.nickname}님이 중독되어 사망하셨습니다.`);
      } else if (currentPlayer.poisonDuration <= 0) {
        state.logs.push(`🐍 ${currentPlayer.nickname}님의 독이 해제되었습니다.`);
      }
    }

    // 감기 처리 (턴 시작 시 1데미지)
    if (currentPlayer.hp > 0 && currentPlayer.coldDuration > 0) {
      currentPlayer.hp = Math.max(0, currentPlayer.hp - 1);
      currentPlayer.coldDuration -= 1;
      state.logs.push(`❄️ ${currentPlayer.nickname}님이 감기로 1데미지를 입었습니다. (남은 지속: ${currentPlayer.coldDuration}턴)`);
      if (currentPlayer.hp <= 0) {
        state.logs.push(`💀 ${currentPlayer.nickname}님이 감기로 인해 얼어붙어 사망하셨습니다.`);
      } else if (currentPlayer.coldDuration <= 0) {
        state.logs.push(`❄️ ${currentPlayer.nickname}님의 감기가 나았습니다.`);
      }
    }

    // 2. 다음 플레이어 결정
    state.turnIndex = (state.turnIndex + 1) % state.players.length;
    let s = 0;
    while (state.players[state.turnIndex].hp <= 0 && s < state.players.length) {
      state.turnIndex = (state.turnIndex + 1) % state.players.length;
      s++;
    }

    const alivePlayers = state.players.filter(p => p.hp > 0);
    if (alivePlayers.length <= 1) {
      if (alivePlayers.length === 1) state.logs.push(`🏆 승리: ${alivePlayers[0].nickname}`);
      else state.logs.push(`🤝 무승부! 모두가 전멸했습니다.`);
      state.phase = 'gameover';
    } else {
      const nextPlayer = state.players[state.turnIndex];
      state.logs.push(`>>> ${nextPlayer.nickname}님의 턴 <<<`);
      
      // 다음 플레이어가 감전 상태면 자동으로 턴을 넘김
      if (nextPlayer.shockDuration > 0) {
        state.logs.push(`⚡ ${nextPlayer.nickname}님은 감전되어 움직일 수 없습니다! (남은 턴: ${nextPlayer.shockDuration})`);
        // 무한 루프 방지: 한 번 호출할 때 최대 한 바퀴만 돌도록 제한
        if (s < state.players.length) {
          return nextTurn(state); 
        }
      }
    }
    return state;
  };

  const handleCreateRoom = () => {
    if (!nickname.trim()) return alert('닉네임을 입력해주세요!');
    setAmIHost(true);
    const code = myPeerId.replace('mcg-', '');
    initMQTTRoom(code, true);
  };
  
  const handleJoinRoom = () => {
    let trimmedCode = roomCode.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (!nickname.trim() || !trimmedCode) return alert('닉네임과 방 코드를 입력해주세요!');
    if (trimmedCode.startsWith('mcg')) trimmedCode = trimmedCode.substring(3);
    setAmIHost(false);
    setScreen('connecting');
    setConnectingMsg('방에 연결하는 중...');
    initMQTTRoom(trimmedCode, false);
  };
  
  const handleStartGame = () => {
    if (players.length < 2) return alert('최소 2명의 플레이어가 필요합니다!');
    const s = { turnIndex: 0, phase: 'main', players: players.map(p => ({ ...p, hand: Array.from({ length: 10 }, getRandomCard), hp: 100, shockDuration: 0, flashDuration: 0, burnDuration: 0, poisonDuration: 0, coldDuration: 0 })), currentAttack: null, logs: ['전투 시작!'] };
    setGameState(s);
    setScreen('game');
    broadcast({ type: 'GAME_START', gameState: s, players });
  };

  const handleRestartGame = () => {
    const s = { 
      turnIndex: 0, 
      phase: 'main', 
      players: gameState.players.map(p => ({ 
        ...p, 
        hand: Array.from({ length: 10 }, getRandomCard), 
        hp: 100, 
        shockDuration: 0, 
        flashDuration: 0, 
        burnDuration: 0, 
        poisonDuration: 0, 
        coldDuration: 0 
      })), 
      currentAttack: null, 
      logs: ['새로운 라운드가 시작되었습니다!'] 
    };
    setGameState(s);
    broadcast({ type: 'GAME_STATE_UPDATE', gameState: s });
  };

  const handleQuitGame = () => {
    if (confirm('방을 종료하시겠습니까? 모든 플레이어가 퇴장됩니다.')) {
      broadcast({ type: 'GAME_QUIT' });
      window.location.reload();
    }
  };

  const toggleCardSelection = (uid) => {
    const card = myState?.hand.find(c => c.uid === uid);
    if (!card) return;
    setSelectedCardUids(prev => {
      if (card.isAOE) return prev.includes(uid) ? [] : [uid];
      const hasAOESelected = prev.some(id => myState?.hand.find(c => c.uid === id)?.isAOE);
      if (hasAOESelected) return [uid];
      return prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid];
    });
  };

  const handleMouseDown = (e) => { isDragging.current = true; dragDistance.current = 0; startX.current = e.pageX - handRef.current.offsetLeft; scrollLeft.current = handRef.current.scrollLeft; handRef.current.style.cursor = 'grabbing'; };
  const handleMouseLeave = () => { isDragging.current = false; handRef.current.style.cursor = 'grab'; };
  const handleMouseUp = () => { isDragging.current = false; handRef.current.style.cursor = 'grab'; };
  const handleMouseMove = (e) => { if (!isDragging.current) return; e.preventDefault(); const x = e.pageX - handRef.current.offsetLeft; const walk = (x - startX.current) * 2; dragDistance.current += Math.abs(x - startX.current); handRef.current.scrollLeft = scrollLeft.current - walk; };

  const myState = gameState?.players.find(p => p.id === myPeerId);
  const isMyTurn = gameState && gameState.players[gameState.turnIndex].id === myPeerId;
  const isTarget = gameState?.currentAttack?.targetId === myPeerId;
  const selectedCards = selectedCardUids.map(uid => myState?.hand.find(c => c.uid === uid));
  const isOrbitShiftSelected = selectedCards.some(c => c?.id === 'orbit_shift');
  const isAOESelected = selectedCards.some(c => c?.isAOE);
  const aoeCardName = selectedCards.find(c => c?.isAOE)?.name;

  return (
    <div className="main-app" style={{ position: 'relative', width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* 상단 연결 상태 표시기 */}
      <div style={{ position: 'fixed', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', zIndex: 1000, background: 'rgba(255,255,255,0.9)', padding: '5px 12px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: mqttClientRef.current?.connected ? '#10b981' : '#f59e0b' }}></div>
        <span style={{ color: '#374151', fontWeight: '500' }}>{mqttClientRef.current?.connected ? 'MQTT 연결됨' : myPeerId ? '대기 중...' : '연결 중...'}</span>
        {!myPeerId && <button onClick={() => window.location.reload()} style={{ padding: '2px 8px', fontSize: '0.7rem', width: 'auto', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>재시도</button>}
      </div>

      <div className={screen === 'game' ? 'game-container' : 'card'}>
        {screen === 'connecting' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌐</div>
            <h2 style={{ marginBottom: '0.5rem' }}>방에 연결하는 중...</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>{connectingMsg}</p>
            <div style={{ width: '200px', height: '4px', background: '#e5e7eb', borderRadius: '2px', margin: '0 auto 1.5rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--primary)', borderRadius: '2px', animation: 'loading-bar 2s ease-in-out infinite' }}></div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>최대 15~30초 소요될 수 있습니다</p>
            <button onClick={() => { if (retryIntervalRef.current) clearInterval(retryIntervalRef.current); setScreen('home'); }} style={{ marginTop: '1.5rem', background: '#64748b', padding: '0.6rem 1.5rem', width: 'auto' }}>취소</button>
          </div>
        )}
        {screen === 'home' && (
          <div>
            <h1>MULTY-CARD</h1>
            <p>친구와 실시간으로 대결하세요</p>
            <div style={{ maxWidth: '320px', margin: '0 auto' }}>
              <input type="text" placeholder="사용할 닉네임" value={nickname} onChange={e => setNickname(e.target.value)} />
              <button onClick={handleCreateRoom} style={{ marginBottom: '1rem' }}>새 방 만들기</button>
              <div className="divider"><span className="divider-text">또는</span></div>
              <input type="text" placeholder="방 코드 (Host ID)" value={roomCode} onChange={e => setRoomCode(e.target.value)} />
              <button onClick={handleJoinRoom} style={{ background: '#64748b' }}>방 참가하기</button>
            </div>
          </div>
        )}

        {screen === 'lobby' && (
          <div>
            <h1>MULTY-CARD 대기실</h1>
            <p style={{ marginBottom: '0.5rem' }}>내 방 코드:</p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '0.75rem', borderRadius: '12px', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: '2px' }}>{displayRoomCode.replace('mcg-', '').toUpperCase()}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(displayRoomCode.replace('mcg-', '').toUpperCase());
                  alert('코드가 복사되었습니다!');
                }}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto', background: '#475569' }}
              >코드 복사</button>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>{players.map(p => <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f9fafb', borderRadius: '12px', marginBottom: '0.5rem', border: '1px solid #e5e7eb' }}><span>{p.nickname}</span> <span>{p.id === myPeerId ? '✅ 나' : 'READY'}</span></li>)}</ul>
            {amIHost ? <button onClick={handleStartGame}>게임 시작</button> : <p style={{ fontWeight: '600', color: '#64748b' }}>호스트가 게임을 시작하길 기다리고 있습니다...</p>}
          </div>
        )}

        {screen === 'game' && gameState && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
            <div style={{ display: 'flex', flex: 1, gap: '1rem', minHeight: 0 }}>
              <div className="game-logs" style={{ flex: 1, overflowY: 'auto' }}>
                {gameState.logs.map((l, i) => <div key={i}>{l}</div>)}
                <div ref={logsEndRef}></div>
              </div>
              <div style={{ width: '280px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', flexShrink: 0 }}>MULTY-CARD 현황</h2>
                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '5px' }}>
                  {gameState.players.map(p => {
                    const isSelected = targetPlayerId === p.id;
                    const canSelect = (gameState.phase === 'main' && isMyTurn) || (gameState.phase === 'defense' && isTarget && isOrbitShiftSelected);
                    return (
                      <div key={p.id} className={`player-item ${isSelected ? 'target-selected' : ''}`} 
                        onClick={() => canSelect && p.hp > 0 && setTargetPlayerId(p.id)} 
                        style={{ opacity: p.hp <= 0 ? 0.4 : 1, position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold' }}>{p.nickname} {p.id === myPeerId ? '(나)' : ''}</span>
                          <span>{p.hp} HP</span>
                        </div>
                        {p.shockDuration > 0 && <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 'bold' }}>⚡ 감전 ({p.shockDuration})</div>}
                        {p.flashDuration > 0 && <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 'bold' }}>✨ 섬광 ({p.flashDuration})</div>}
                        {p.burnDuration > 0 && <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 'bold' }}>🔥 화상 ({p.burnDuration})</div>}
                        {p.poisonDuration > 0 && <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'bold' }}>🐍 독 ({p.poisonDuration})</div>}
                        {p.coldDuration > 0 && <div style={{ fontSize: '0.7rem', color: '#0ea5e9', fontWeight: 'bold' }}>❄️ 감기 ({p.coldDuration})</div>}
                        <div className="hp-bar"><div className={`hp-fill ${p.hp < 30 ? 'low' : ''}`} style={{ width: `${p.hp}%` }}></div></div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {isMyTurn && myState?.hp > 0 && gameState.phase === 'main' && (
                    <>
                      <button disabled={myState.shockDuration > 0} onClick={() => {
                        if (!targetPlayerId && !isAOESelected) return alert('타겟을 선택하세요!');
                        if (selectedCardUids.length === 0) return alert('카드를 선택하세요!');
                        const data = { targetId: targetPlayerId, cardUids: selectedCardUids };
                        if (amIHost) processAttack(myPeerId, data); else sendToHost({ type: 'ACTION_ATTACK', data });
                        setSelectedCardUids([]); setTargetPlayerId(null);
                      }} style={{ background: isAOESelected ? '#4b5563' : '#ef4444', padding: '1rem' }}>{isAOESelected ? `${aoeCardName} 시전` : '공격하기'}</button>
                      <button onClick={() => { if (amIHost) processSkip(myPeerId); else sendToHost({ type: 'ACTION_SKIP' }); }} style={{ background: '#64748b', padding: '1rem' }}>턴 넘기기</button>
                    </>
                  )}
                  {gameState.phase === 'defense' && isTarget && (
                    <button onClick={() => {
                      const data = { cardUids: selectedCardUids, newTargetId: targetPlayerId };
                      if (amIHost) processDefense(myPeerId, data); else sendToHost({ type: 'ACTION_DEFENSE', data });
                      setSelectedCardUids([]); setTargetPlayerId(null);
                    }} style={{ background: '#3b82f6', padding: '1rem' }}>{isOrbitShiftSelected ? '궤도변환 실행' : '방어 / 받기'}</button>
                  )}
                  {gameState.phase === 'gameover' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {amIHost ? (
                        <>
                          <button onClick={handleRestartGame} style={{ background: '#10b981', flex: 1 }}>다시 하기</button>
                          <button onClick={handleQuitGame} style={{ background: '#ef4444', flex: 1 }}>종료하기</button>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', width: '100%', padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                          호스트의 결정을 기다리고 있습니다...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="hand-container" ref={handRef} onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} style={{ opacity: myState?.hp <= 0 ? 0.5 : 1 }}>
              {myState?.hand.map(c => (
                <div key={c.uid} className={`playing-card type-${c.type} ${selectedCardUids.includes(c.uid) ? 'selected' : ''}`} onClick={() => dragDistance.current < 5 && toggleCardSelection(c.uid)} draggable={false}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{c.icon}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)' }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', flex: 1, whiteSpace: 'pre-wrap', color: 'var(--text-muted)', marginTop: '5px' }}>{c.description}</div>
                  <div style={{ fontWeight: 'bold', borderTop: '1px solid #e5e7eb', paddingTop: '5px', color: 'var(--text-main)' }}>{c.value > 0 ? c.value : '-'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 하단 버전 정보 */}
        <div style={{ position: 'fixed', bottom: '5px', right: '10px', fontSize: '0.6rem', color: '#9ca3af' }}>
          v1.3.0 - Nostr P2P (443 WSS)
        </div>
      </div>
    </div>
  );
}
