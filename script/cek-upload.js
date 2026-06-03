// script/cek-upload.js
// Konfirmasi: proxy izinin GET tapi blok POST ke host media WA?
// GET vs POST ke host yang SAMA. Jalanin: node script/cek-upload.js
const path = require('path');
const { globalAgent } = require(path.join(__dirname, '../bots/proxyConfig'));
const axios = require('axios');

const HOST = 'media-cgk1-1.cdn.whatsapp.net';
const payload = Buffer.alloc(2048, 1);

async function req(label, method, body) {
    try {
        const r = await axios({
            method,
            url: 'https://' + HOST + '/',
            data: body,
            httpsAgent: globalAgent,
            proxy: false,
            timeout: 20000,
            maxRedirects: 0,
            responseType: 'text',
            transitional: { silentJSONParsing: true, forcedJSONParsing: false },
            headers: body ? { 'Content-Type': 'application/octet-stream' } : {},
            validateStatus: () => true,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });
        console.log(label, '-> RESPON status', r.status);
    } catch (e) {
        console.log(label, '-> ERR', e.code || e.message);
    }
}

(async () => {
    console.log('target:', HOST);
    await req('1. GET ', 'get', undefined);
    await req('2. POST', 'post', payload);
})();
