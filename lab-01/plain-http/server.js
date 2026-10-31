// Task 3: A basic server using Node.js' built-in http module.
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello');
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Plain HTTP server is running at http://localhost:${PORT}`);
});
