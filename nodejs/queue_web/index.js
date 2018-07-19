const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let i = 0;
const makeGetReq = function(endpoint, cb) {
    http.get(endpoint, (resp) => {
        let data = '';
       
        resp.on('data', (chunk) => {
          data += chunk;
        });
       
        resp.on('end', () => {
          cb(JSON.parse(data));
        });
       
      }).on("error", (err) => {
        console.log("Error: " + err.message);
      });
};

const makePostReq = function(endpoint, body, cb) {
    let options = {
        hostname: 'localhost',
        port: 8889,
        path: endpoint,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    }
    const req = http.request(options, function(resp) {
        resp.setEncoding('utf8');
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        
        resp.on('end', () => {
            cb(JSON.parse(data));
        });
    });
    req.write(body);
    req.end();
};

app.get('/list', (req, res) => {
    const type = req.query.type;
    makeGetReq(`http://localhost:8889/list?type=${type}`, function(data) {
        let items = data.items;
        items = items.map( item => JSON.parse(item));
        data.items = items;
        res.send(data);
    });
});

app.post('/enqueue', (req, res) => {
    const reqBody = req.body;
    const type = reqBody.type;
    i++;
    const body = `{"name": "Customer - ${i}", "type": "${type}"}`;
    makePostReq('/enqueue', body, function(data) {
        res.send(data);
    });
});

app.get('/dequeue', (req, res) => {
    const service = req.query.service;
    const type = service[0];
    makeGetReq(`http://localhost:8889/dequeue?type=${type}&service=${service}`, function(data) {
        res.send(data);
    });
});

app.get('/services', (req, res) => {
    const services = req.query.services;
    makeGetReq(`http://localhost:8889/services?query=${services}`, function(data) {
        res.send(data);
    });
});

app.use(express.static(path.join(__dirname, 'public')));
app.listen(3000, () => console.log('Queue Server listening on port 3000!'));