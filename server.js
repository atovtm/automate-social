const express = require('express');
const app = express();
const port = 8080;
const cors = require('cors');
const { openai } = require('openai');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

app.use(express.static('public', { 
    setHeaders: function (res, path, stat) {
      if (path.endsWith('.js')) {
        res.set('Content-Type', 'application/javascript');
      }
    }
  }));
  

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate-text', async (req, res) => {
  const { prompt, length, temperature } = req.body;
  const text = await openai(prompt, length, temperature);
  const canvas = createCanvas(500, 500);
  const ctx = canvas.getContext('2d');
  const image = await loadImage(path.join(__dirname, 'public', 'background.jpg'));
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  ctx.font = '30px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  const lines = text.split('\n');
  let yOffset = 100;
  for (const line of lines) {
    ctx.fillText(line, canvas.width / 2, yOffset);
    yOffset += 40;
  }
  const imageData = canvas.toDataURL('image/jpeg', 1.0).replace(/^data:image\/jpeg;base64,/, '');
  fs.writeFile(path.join(__dirname, 'public', 'generated-image.jpg'), imageData, 'base64', function (err) {
    if (err) {
      console.log(err);
      res.status(500).send('Error generating image');
    } else {
      res.json({ success: true });
    }
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

const http = require('http');

http.createServer(function(req, res) {
  if (req.url === '/generated-image.jpg') {
    fs.readFile(path.join(__dirname, 'public', 'generated-image.jpg'), function(err, data) {
      if (err) {
        res.writeHead(404, {'Content-Type': 'text/html'});
        return res.end("404 Not Found");
      }

      res.writeHead(200, {'Content-Type': 'image/jpeg'});
      res.end(data);
    });
  } else {
    fs.readFile(path.join(__dirname, 'public', 'index.html'), function(err, data) {
      if (err) {
        res.writeHead(404, {'Content-Type': 'text/html'});
        return res.end("404 Not Found");
      }

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(data);
    });
  }
}).listen(3000);

