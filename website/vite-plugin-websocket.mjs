import { WebSocketServer } from 'ws';

export function websocketPlugin() {
  return {
    name: 'websocket-plugin',
    configureServer(server) {
      const wss = new WebSocketServer({ port: 8080 });
      
      console.log('🔌 Strudel WebSocket server running on ws://localhost:8080');
      console.log('📝 Ready for Neovim integration!');
      
      let connectedClients = [];
      
      wss.on('connection', function connection(ws) {
        console.log('🔗 Client connected to WebSocket');
        connectedClients.push(ws);
        
        ws.on('message', function incoming(message) {
          const data = message.toString();
          console.log('📨 Received:', data);
          
          try {
            // Parse the command from Neovim
            if (data.startsWith('NVIM:')) {
              const payload = data.substring(5); // Remove 'NVIM:' prefix
              let commandData;
              
              try {
                // Try to parse as JSON first (new structured commands)
                commandData = JSON.parse(payload);
                console.log('🎵 JSON Command:', commandData.command);
              } catch (jsonError) {
                // Fallback: treat as raw code (backwards compatibility)
                console.log('📝 Raw code received, treating as update command');
                commandData = {
                  command: 'update',
                  code: payload
                };
              }
              
              // Broadcast to all connected browser clients
              connectedClients.forEach(client => {
                if (client !== ws && client.readyState === 1) { // WebSocket.OPEN
                  client.send(JSON.stringify(commandData));
                }
              });
            }
          } catch (error) {
            console.error('❌ Error processing WebSocket message:', error);
          }
        });
        
        ws.on('close', function() {
          console.log('🔌 Client disconnected');
          connectedClients = connectedClients.filter(client => client !== ws);
        });
        
        ws.on('error', function(error) {
          console.error('❌ WebSocket error:', error);
        });
        
        // Send welcome message
        ws.send(JSON.stringify({ 
          command: 'welcome', 
          message: 'Connected to Strudel WebSocket server!' 
        }));
      });
      
      // Cleanup on server close
      server.ws.on('close', () => {
        wss.close();
      });
    }
  };
} 