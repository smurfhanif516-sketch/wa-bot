// utils/jsonToTableImage.js
// Render JSON table -> PNG buffer pakai @napi-rs/canvas (prebuilt, no native build).
// Input shape: { title?: string, headers: string[], rows: (string|number)[][] }

const { createCanvas } = require('@napi-rs/canvas');

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
    font: 'sans-serif',
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

function renderTableImage(data) {
    if (!isTablePayload(data)) {
        throw new Error('Invalid table payload: butuh { headers: [], rows: [[]] }');
    }

    const { title } = data;
    const headers = data.headers.map((h) => String(h ?? ''));
    const rows = data.rows.map((r) => r.map((c) => String(c ?? '')));
    const colCount = headers.length;

    // Canvas sementara buat measure teks.
    const measure = createCanvas(10, 10).getContext('2d');

    // Hitung lebar tiap kolom (max dari header & semua sel).
    const colWidths = new Array(colCount).fill(0);
    const cellFont = `${STYLE.fontSize}px ${STYLE.font}`;
    const headerFont = `bold ${STYLE.fontSize}px ${STYLE.font}`;

    for (let c = 0; c < colCount; c++) {
        measure.font = headerFont;
        colWidths[c] = measure.measureText(headers[c]).width;
        measure.font = cellFont;
        for (const row of rows) {
            const w = measure.measureText(row[c] ?? '').width;
            if (w > colWidths[c]) colWidths[c] = w;
        }
        colWidths[c] += STYLE.cellPadX * 2;
    }

    const rowHeight = STYLE.fontSize + STYLE.cellPadY * 2;
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);

    // Judul (opsional).
    let titleHeight = 0;
    if (title) {
        measure.font = `bold ${STYLE.titleSize}px ${STYLE.font}`;
        titleHeight = STYLE.titleSize + STYLE.margin / 2;
    }

    const totalRows = rows.length + 1; // +1 header
    const canvasW = Math.ceil(tableWidth + STYLE.margin * 2);
    const canvasH = Math.ceil(
        STYLE.margin * 2 + titleHeight + totalRows * rowHeight
    );

    const canvas = createCanvas(canvasW, canvasH);
    const ctx = canvas.getContext('2d');

    // Background.
    ctx.fillStyle = STYLE.pageBg;
    ctx.fillRect(0, 0, canvasW, canvasH);

    let cursorY = STYLE.margin;

    // Judul.
    if (title) {
        ctx.fillStyle = STYLE.titleColor;
        ctx.font = `bold ${STYLE.titleSize}px ${STYLE.font}`;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillText(String(title), STYLE.margin, cursorY);
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
    ctx.textBaseline = 'middle';
    ctx.fillStyle = STYLE.headerFg;
    let x = tableX;
    for (let c = 0; c < colCount; c++) {
        ctx.textAlign = 'left';
        ctx.fillStyle = STYLE.headerFg;
        ctx.fillText(headers[c], x + STYLE.cellPadX, tableY + rowHeight / 2);
        x += colWidths[c];
    }

    // Teks body.
    ctx.font = cellFont;
    for (let r = 0; r < rows.length; r++) {
        x = tableX;
        const rowY = tableY + (r + 1) * rowHeight + rowHeight / 2;
        for (let c = 0; c < colCount; c++) {
            ctx.fillStyle = STYLE.textColor;
            ctx.textAlign = 'left';
            ctx.fillText(rows[r][c] ?? '', x + STYLE.cellPadX, rowY);
            x += colWidths[c];
        }
    }

    // Garis grid.
    ctx.strokeStyle = STYLE.borderColor;
    ctx.lineWidth = 1;
    // Horizontal.
    for (let r = 0; r <= totalRows; r++) {
        const y = tableY + r * rowHeight;
        ctx.beginPath();
        ctx.moveTo(tableX, y);
        ctx.lineTo(tableX + tableWidth, y);
        ctx.stroke();
    }
    // Vertikal.
    x = tableX;
    for (let c = 0; c <= colCount; c++) {
        ctx.beginPath();
        ctx.moveTo(x, tableY);
        ctx.lineTo(x, tableY + totalRows * rowHeight);
        ctx.stroke();
        if (c < colCount) x += colWidths[c];
    }

    return canvas.toBuffer('image/png');
}

// Balikin data URI base64 -> langsung kompatibel dgn sendMessage() di index.js.
function renderTableDataUri(data) {
    const buffer = renderTableImage(data);
    return `data:image/png;base64,${buffer.toString('base64')}`;
}

module.exports = { isTablePayload, renderTableImage, renderTableDataUri };
