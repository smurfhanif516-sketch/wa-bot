const fs = require("fs");
const path = require("path");

const STATS_DIR = path.join(__dirname, "../stats");

let currentHourStats = {};        // per nomor bot
let currentHourGroupStats = {};   // per group id
let currentHour = null;
let currentDate = null;

// Ensure stats folder exists
function ensureStatsDir() {
    if (!fs.existsSync(STATS_DIR)) {
        fs.mkdirSync(STATS_DIR, { recursive: true });
    }
}

// Get formatted date parts
function getDateParts() {
    const now = new Date();
    return {
        yyyy: now.getFullYear(),
        mm: String(now.getMonth() + 1).padStart(2, "0"),
        dd: String(now.getDate()).padStart(2, "0"),
        hour: String(now.getHours()).padStart(2, "0")
    };
}

// Get today file path (per nomor bot)
function getTodayFile() {
    const { yyyy, mm, dd } = getDateParts();
    return path.join(STATS_DIR, "stats-" + yyyy + "-" + mm + "-" + dd + ".json");
}

// Get today file path (per group)
function getTodayGroupFile() {
    const { yyyy, mm, dd } = getDateParts();
    return path.join(STATS_DIR, "group-stats-" + yyyy + "-" + mm + "-" + dd + ".json");
}

// Create file if not exists
function ensureFile(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }
    return filePath;
}

// Reset buffer kalau tanggal/jam berubah
function rollWindow() {
    const { yyyy, mm, dd, hour } = getDateParts();
    const today = yyyy + "-" + mm + "-" + dd;

    // Tanggal berubah → reset semua
    if (currentDate !== today) {
        currentHourStats = {};
        currentHourGroupStats = {};
        currentHour = hour;
        currentDate = today;
    }

    // Jam berubah → reset counter jam baru
    if (currentHour !== hour) {
        currentHourStats = {};
        currentHourGroupStats = {};
        currentHour = hour;
    }
}

// Increment counter per nomor bot
function increment(botName) {
    rollWindow();
    if (!currentHourStats[botName]) currentHourStats[botName] = 0;
    currentHourStats[botName]++;
}

// Increment counter per group id
function incrementGroup(groupId) {
    if (!groupId) return;
    rollWindow();
    if (!currentHourGroupStats[groupId]) currentHourGroupStats[groupId] = 0;
    currentHourGroupStats[groupId]++;
}

// Merge buffer ke file (atomic). buffer = { key: count }
function flushBuffer(filePath, buffer) {
    if (Object.keys(buffer).length === 0) return;

    ensureFile(filePath);

    let data = {};
    try {
        data = JSON.parse(fs.readFileSync(filePath));
    } catch (err) {
        console.error("Stats file corrupted, recreating: " + filePath);
        data = {};
    }

    if (!data[currentHour]) data[currentHour] = {};

    for (const key in buffer) {
        if (!data[currentHour][key]) data[currentHour][key] = 0;
        data[currentHour][key] += buffer[key];
    }

    const tempPath = filePath + ".tmp";
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
    fs.renameSync(tempPath, filePath);
}

// Flush ke file (bot + group)
function flush() {
    if (!currentHour || !currentDate) return;

    ensureStatsDir();
    flushBuffer(getTodayFile(), currentHourStats);
    flushBuffer(getTodayGroupFile(), currentHourGroupStats);

    // Reset counter setelah flush
    currentHourStats = {};
    currentHourGroupStats = {};
}

module.exports = {
    increment,
    incrementGroup,
    flush
};
