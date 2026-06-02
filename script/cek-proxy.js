// script/cek-proxy.js
// Tes apakah proxy (proxyConfig.globalAgent) tembus host WA.
// Jalanin: node script/cek-proxy.js
const path = require('path');
const https = require('https');
const { globalAgent } = require(path.join(__dirname, '../bots/proxyConfig'));

const hosts = [
    'example.com',        // host netral -> cek globalAgent hidup
    'registry.npmjs.org', // netral lain
    'web.whatsapp.com',   // jalur teks/login (.com)
    'g.whatsapp.com',     // login
    'mmg.whatsapp.net',   // upload media (.net)
    'media.whatsapp.net', // media
    'mmg-fna.whatsapp.net'// media
];

console.log('Proxy agent:', globalAgent ? 'ADA' : 'TIDAK ADA');
hosts.forEach((host) => {
    const req = https.request(
        { host, path: '/', method: 'HEAD', agent: globalAgent, timeout: 15000 },
        (res) => console.log(host, '->', res.statusCode)
    );
    req.on('timeout', () => { console.log(host, '-> TIMEOUT'); req.destroy(); });
    req.on('error', (e) => console.log(host, '-> ERR', e.code || e.message));
    req.end();
});
