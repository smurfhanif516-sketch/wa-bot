// ./utils/proxy-agent.js
const { HttpsProxyAgent } = require('https-proxy-agent');

const PROXY_HOST = '10.17.6.215';
const PROXY_PORT = '8080';
const PROXY_USER = 'WAserver';
const PROXY_PASS = 'Bandar12#$';

const proxyUrl = `http://${PROXY_USER}:${encodeURIComponent(PROXY_PASS)}@${PROXY_HOST}:${PROXY_PORT}`;
const proxyAgent = new HttpsProxyAgent(proxyUrl);

module.exports = proxyAgent;
