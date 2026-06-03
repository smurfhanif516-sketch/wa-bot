// script/cek-upload.js
// Tes apakah POST (stream vs buffer) ke host upload media WA tembus lewat proxy.
// Tujuan: bedain "stream chunked di-tutup proxy" vs "host ga reachable".
// Jalanin: node script/cek-upload.js
const path = require('path');
const { Readable } = require('stream');
const { globalAgent } = require(path.join(__dirname, '../bots/proxyConfig'));
const axios = require('axios');

const HOST = 'media-cgk1-1.cdn.whatsapp.net'; // salah satu host upload nyata
const URL = 'https://' + HOST + '/mms/image/test?auth=test&token=test';
const payload = Buffer.alloc(2048, 1); // 2KB dummy

async function tryPost(label, body) {
    try {
        const r = await axios.post(URL, body, {
            httpsAgent: globalAgent,
            proxy: false,
            timeout: 20000,
            maxRedirects: 0,
            headers: { 'Content-Type': 'application/octet-stream' },
            validateStatus: () => true,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });
        console.log(label, '-> RESPON status', r.status); // dapet status = koneksi utuh
    } catch (e) {
        console.log(label, '-> ERR', e.code || e.message); // abort/aborted = koneksi diputus
    }
}

(async () => {
    console.log('target:', HOST);
    // BUFFER body -> axios set Content-Length (bukan chunked)
    await tryPost('1. buffer (Content-Length)', payload);
    // STREAM body -> axios chunked transfer-encoding (kaya baileys)
    await tryPost('2. stream (chunked)', Readable.from(payload));
})();
