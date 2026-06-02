// proxyConfig.js
const { HttpsProxyAgent } = require('https-proxy-agent');
const axios = require('axios');
const fetch = require('node-fetch');

// === Proxy Credentials ===
const PROXY_HOST = '10.17.6.215';
const PROXY_PORT = '8080';
const PROXY_USER = 'WAserver';
const PROXY_PASS = 'Bandar12#$';

//const PROXY_HOST = '172.30.201.188';
//const PROXY_PORT = '8080';

const proxyUser = encodeURIComponent(PROXY_USER);
const proxyPass = encodeURIComponent(PROXY_PASS);
const proxyUrl = `http://${proxyUser}:${proxyPass}@${PROXY_HOST}:${PROXY_PORT}`;

//const proxyUrl = `http://${PROXY_HOST}:${PROXY_PORT}`;


// === Global HTTPS Agent ===
const globalAgent = new HttpsProxyAgent(proxyUrl);

// === Global Fetch Override ===
globalThis.fetch = (url, options = {}) => fetch(url, { agent: globalAgent, ...options });

// === Axios Global Proxy Config ===
axios.defaults.httpsAgent = globalAgent;
axios.defaults.proxy = false;

// === Export Agent for Baileys/Socket ===
module.exports = {
    globalAgent,
};


// const { HttpsProxyAgent } = require('https-proxy-agent');
// const axios = require('axios');

// // === Proxy Credentials ===
// const PROXY_HOST = '10.17.6.215';
// const PROXY_PORT = '8080';
// const PROXY_USER = 'WAserver';
// const PROXY_PASS = 'Bandar12#$';

// const proxyUser = encodeURIComponent(PROXY_USER);
// const proxyPass = encodeURIComponent(PROXY_PASS);
// const proxyUrl = `http://${proxyUser}:${proxyPass}@${PROXY_HOST}:${PROXY_PORT}`;

// // === Global HTTPS Agent ===
// const globalAgent = new HttpsProxyAgent(proxyUrl);

// // === Global Fetch Override (pakai dynamic import) ===
// globalThis.fetch = async (url, options = {}) => {
//     const { default: fetch } = await import('node-fetch');
//     return fetch(url, { agent: globalAgent, ...options });
// };

// // === Axios Global Proxy Config ===
// axios.defaults.httpsAgent = globalAgent;
// axios.defaults.proxy = false;

// // === Export Agent for Baileys/Socket ===
// module.exports = {
//     globalAgent,
// };

