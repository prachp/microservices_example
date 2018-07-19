const WebSocket = require('ws');
const querystring = require('querystring');
const http = require('http');
const url = require('url');


const server = http.createServer(function(req, res) {
    
});

const wss = new WebSocket.Server({ noServer: true });

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

server.on('upgrade', function upgrade(request, socket, head) {
    const pathname = url.parse(request.url).pathname;
    if (pathname === '/sync') {
        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit('connection', ws, request);
        });
    } else {
      socket.destroy();
    }
  });

server.listen(3003);
console.log('Webscoket service is running on port 3003!');

let amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
        var q = 'notification';

        ch.assertQueue(q, {durable: false});
        console.log("Notification Message Queue is ready!");
        ch.consume(q, function(msg) {
            const msgBody = msg.content.toString().split(':');
            console.log("Received message: %s", msgBody.join(':'));
            const service = msgBody[0];
            const item = msgBody[1];
            wss.broadcast(JSON.stringify({service: service, item: item}));
        }, {noAck: true});
  });
});