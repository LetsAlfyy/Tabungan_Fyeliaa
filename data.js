// data.js - JSON FILE STORAGE
import { writeFileSync, readFileSync } from 'fs';

const DATA_FILE = '/tmp/fyeliaa-data.json';

function readData() {
  try {
    const data = readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      transactions: [],
      notes: "Selamat datang di Fyeliaa! 💰"
    };
  }
}

function writeData(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
