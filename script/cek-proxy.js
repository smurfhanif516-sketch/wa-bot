// script/cek-proxy.js
// Tes apakah proxy (globalAgent) bisa nyampe host WA, pakai jalur PERSIS
// kaya upload media Baileys (axios + globalAgent). Jalanin: node script/cek-proxy.js
const path = require('path');
const { globalAgent } = require(path.join(__dirname, '../bots/proxyConfig'));
const axios = require('axios');

const hosts = [
    'web.whatsapp.com',   // jalur login (kontrol)
    'g.whatsapp.com',
    'mmg.whatsapp.net',   // upload media
    'media.whatsapp.net',
    'mmg-fna.whatsapp.net',
];

(async () => {
    console.log('proxy agent:', globalAgent ? 'ADA' : 'TIDAK ADA');
    for (const h of hosts) {
        try {
            const r = await axios.get('https://' + h + '/', {
                httpsAgent: globalAgent,
                proxy: false,
                timeout: 15000,
                validateStatus: () => true, // status apapun = tembus
            });
            console.log(h, '-> OK', r.status);
        } catch (e) {
            console.log(h, '-> ERR', e.code || (e.response && e.response.status) || e.message);
        }
    }
})();
