
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3000');
let playerId = null;
let currentIp = null;

ws.on('open', () => {
  console.log('Connected to server');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('Received:', msg.type);

  if (msg.type === 'INIT') {
    console.log('Player initialized');
    playerId = msg.payload.playerId;
    currentIp = msg.payload.currentNetwork.ip;
    console.log(`ID: ${playerId}`);
    console.log(`Location: ${currentIp} (${msg.payload.currentNetwork.zone})`);
    
    // Send a scan command
    console.log(`Sending SCAN for ${currentIp}...`);
    ws.send(JSON.stringify({
      type: 'SCAN',
      payload: { targetIp: currentIp }
    }));
  }

  if (msg.type === 'SCAN_RESULT') {
    console.log('Scan result received:', msg.payload);
    
    // Try to connect
    if (!msg.payload.error) {
      console.log(`Connecting to ${currentIp}...`);
      ws.send(JSON.stringify({
        type: 'CONNECT',
        payload: { targetIp: currentIp }
      }));
    }
  }

  if (msg.type === 'CONNECT_RESULT') {
    console.log('Connection result:', msg.payload.success ? 'Success' : 'Failed');
    
    // Try to deploy a structure (should fail due to credits/zone)
    console.log('Attempting to deploy structure...');
    ws.send(JSON.stringify({
      type: 'DEPLOY_STRUCTURE',
      payload: { type: 'control_node', networkId: 'some_id' }
    }));
    
    setTimeout(() => {
      console.log('Closing connection');
      ws.close();
    }, 1000);
  }
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err);
});
