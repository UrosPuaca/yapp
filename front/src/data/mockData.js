// Mock podaci iz prototipa — u produkciji zameniti API/websocket slojem.
export const CONTACTS = [
  { id: 'yuki', name: 'YUKI_88', status: 'online', bio: '3:14am, ne mogu da spim opet' },
  { id: 'ren', name: 'REN_TOKYO', status: 'away', bio: 'kisa u tokiju u kruznom repeat-u' },
  { id: 'sakura', name: 'SAKURA.EXE', status: 'offline', bio: 'offline. previse mislim.' },
];

// "Imenik" cele mreze — useri sa kojima jos nema razgovora (mock za pretragu)
export const DIRECTORY = [
  { id: 'neo', name: 'NEO_SHIBUYA', status: 'online', bio: 'neon je moj suncev sjaj' },
  { id: 'kira', name: 'KIRA.SYS', status: 'away', bio: 'debugujem snove od 1999' },
  { id: 'hako', name: 'HAKO_BOT', status: 'online', bio: 'beep boop. mozda sam covek.' },
  { id: 'mochi', name: 'MOCHI_PIXEL', status: 'offline', bio: 'crtam piksele dok grad spava' },
  { id: 'denji', name: 'DENJI_X', status: 'online', bio: 'struja nikad ne spava' },
  { id: 'aiko', name: 'AIKO_2000', status: 'away', bio: 'y2k preziveo, sve ostalo je bonus' },
];

export const SEED_MESSAGES = {
  yuki: [
    { from: 'them', text: 'prva probna poruka', time: '23:04' },
    { from: 'me', text: 'druga probna poruka', time: '23:06' },
    { from: 'them', text: 'bas je guzva danas', time: '23:07' },
  ],
  ren: [
    { from: 'them', text: 'poslao sam fajl, provuci ga kroz stari modem', time: '21:40' },
    { from: 'me', text: 'primljeno. cekam download... 12%', time: '21:41' },
    { from: 'them', text: 'strpi se, veza je stara kao i grad', time: '21:42' },
  ],
  sakura: [
    { from: 'them', text: 'sistem ide na odrzavanje do ponoci', time: '19:58' },
    { from: 'me', text: 'kao i uvek :)', time: '20:00' },
  ],
};
