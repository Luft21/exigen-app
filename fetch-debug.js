const http = require('http');
http.get('http://localhost:3000/tiket', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/DEBUG_INFO_START(.*?)DEBUG_INFO_END/);
    if (match) console.log(match[1]);
    else console.log("Not found");
  });
}).on('error', err => console.log(err.message));
