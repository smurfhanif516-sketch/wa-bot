// utils/jsonToTableImage.js
// Render JSON table -> PNG buffer pakai pureimage (PURE JS, tanpa binary native).
// node_modules aman di-copy Windows <-> Linux (ga ada .node platform-specific).
// Input shape: { title?: string, headers: string[], rows: (string|number)[][] }

const fs = require('fs');
const path = require('path');
const { Writable } = require('stream');
const PImage = require('pureimage');

// === Register font sekali (pureimage butuh file .ttf, ga pakai font sistem) ===
const FONT_DIR = path.join(__dirname, '../assets/fonts');
const FONT_REGULAR = 'DejaVuSans';
const FONT_BOLD = 'DejaVuSans-Bold';

let fontsLoaded = false;
function ensureFonts() {
    if (fontsLoaded) return;
    PImage.registerFont(path.join(FONT_DIR, 'DejaVuSans.ttf'), FONT_REGULAR).loadSync();
    PImage.registerFont(path.join(FONT_DIR, 'DejaVuSans-Bold.ttf'), FONT_BOLD).loadSync();
    fontsLoaded = true;
}

// Cek apakah payload memang JSON-table (dipakai index.js buat deteksi).
function isTablePayload(msg) {
    return (
        msg &&
        typeof msg === 'object' &&
        !Array.isArray(msg) &&
        Array.isArray(msg.headers) &&
        Array.isArray(msg.rows)
    );
}

const STYLE = {
    fontSize: 22,
    titleSize: 30,
    cellPadX: 18,
    cellPadY: 12,
    headerBg: '#1f6feb',
    headerFg: '#ffffff',
    rowBgA: '#ffffff',
    rowBgB: '#f1f5f9',
    borderColor: '#cbd5e1',
    textColor: '#0f172a',
    titleColor: '#0f172a',
    pageBg: '#ffffff',
    margin: 30,
};

// pureimage: fillText pakai y = baseline. Approx ascent buat center vertikal.
function baselineFor(centerY, size) {
    return centerY + size * 0.34;
}

// Encode Bitmap -> PNG Buffer.
function encodePng(img) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const sink = new Writable({
            write(chunk, _enc, cb) {
                chunks.push(chunk);
                cb();
            },
        });
        sink.on('finish', () => resolve(Buffer.concat(chunks)));
        sink.on('error', reject);
        PImage.encodePNGToStream(img, sink).catch(reject);
    });
}

async function renderTableImage(data) {
    if (!isTablePayload(data)) {
        throw new Error('Invalid table payload: butuh { headers: [], rows: [[]] }');
    }
    ensureFonts();

    const { title } = data;
    const headers = data.headers.map((h) => String(h ?? ''));
    const rows = data.rows.map((r) => r.map((c) => String(c ?? '')));
    const colCount = headers.length;

    const cellFont = `${STYLE.fontSize}pt '${FONT_REGULAR}'`;
    const headerFont = `${STYLE.fontSize}pt '${FONT_BOLD}'`;
    const titleFont = `${STYLE.titleSize}pt '${FONT_BOLD}'`;

    // Canvas sementara buat measure teks.
    const measureImg = PImage.make(10, 10);
    const m = measureImg.getContext('2d');

    // Lebar tiap kolom (max header & sel).
    const colWidths = new Array(colCount).fill(0);
    for (let c = 0; c < colCount; c++) {
        m.font = headerFont;
        colWidths[c] = m.measureText(headers[c]).width;
        m.font = cellFont;
        for (const row of rows) {
            const w = m.measureText(row[c] ?? '').width;
            if (w > colWidths[c]) colWidths[c] = w;
        }
        colWidths[c] = Math.ceil(colWidths[c] + STYLE.cellPadX * 2);
    }

    const rowHeight = STYLE.fontSize + STYLE.cellPadY * 2;
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);

    let titleHeight = 0;
    if (title) titleHeight = STYLE.titleSize + STYLE.margin / 2;

    const totalRows = rows.length + 1; // +1 header
    const canvasW = Math.ceil(tableWidth + STYLE.margin * 2);
    const canvasH = Math.ceil(STYLE.margin * 2 + titleHeight + totalRows * rowHeight);

    const img = PImage.make(canvasW, canvasH);
    const ctx = img.getContext('2d');

    // Background.
    ctx.fillStyle = STYLE.pageBg;
    ctx.fillRect(0, 0, canvasW, canvasH);

    let cursorY = STYLE.margin;

    // Judul.
    if (title) {
        ctx.fillStyle = STYLE.titleColor;
        ctx.font = titleFont;
        ctx.fillText(String(title), STYLE.margin, baselineFor(cursorY + STYLE.titleSize / 2, STYLE.titleSize));
        cursorY += titleHeight;
    }

    const tableX = STYLE.margin;
    const tableY = cursorY;

    // Header row bg.
    ctx.fillStyle = STYLE.headerBg;
    ctx.fillRect(tableX, tableY, tableWidth, rowHeight);

    // Body row bg (zebra).
    for (let r = 0; r < rows.length; r++) {
        ctx.fillStyle = r % 2 === 0 ? STYLE.rowBgA : STYLE.rowBgB;
        ctx.fillRect(tableX, tableY + (r + 1) * rowHeight, tableWidth, rowHeight);
    }

    // Teks header.
    ctx.font = headerFont;
    ctx.fillStyle = STYLE.headerFg;
    let x = tableX;
    for (let c = 0; c < colCount; c++) {
        ctx.fillText(headers[c], x + STYLE.cellPadX, baselineFor(tableY + rowHeight / 2, STYLE.fontSize));
        x += colWidths[c];
    }

    // Teks body.
    ctx.font = cellFont;
    ctx.fillStyle = STYLE.textColor;
    for (let r = 0; r < rows.length; r++) {
        x = tableX;
        const baseY = baselineFor(tableY + (r + 1) * rowHeight + rowHeight / 2, STYLE.fontSize);
        for (let c = 0; c < colCount; c++) {
            ctx.fillText(rows[r][c] ?? '', x + STYLE.cellPadX, baseY);
            x += colWidths[c];
        }
    }

    // Garis grid.
    ctx.strokeStyle = STYLE.borderColor;
    ctx.lineWidth = 1;
    for (let r = 0; r <= totalRows; r++) {
        const y = tableY + r * rowHeight;
        ctx.beginPath();
        ctx.moveTo(tableX, y);
        ctx.lineTo(tableX + tableWidth, y);
        ctx.stroke();
    }
    x = tableX;
    for (let c = 0; c <= colCount; c++) {
        ctx.beginPath();
        ctx.moveTo(x, tableY);
        ctx.lineTo(x, tableY + totalRows * rowHeight);
        ctx.stroke();
        if (c < colCount) x += colWidths[c];
    }

    return encodePng(img);
}

// Balikin data URI base64 -> langsung kompatibel dgn sendMessage() di index.js.
async function renderTableDataUri(data) {
    const buffer = await renderTableImage(data);
    return `data:image/png;base64,${buffer.toString('base64')}`;
}

module.exports = { isTablePayload, renderTableImage, renderTableDataUri };
