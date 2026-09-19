/* Pixel-art ikonice reakcija, 12x12 mreza.
   Crtaju se od kvadratica, bez krivulja — isti jezik kao StatusDot i bubble
   bordovi. Imena tipova su vrednosti enuma sa backenda, ne dirati. */

// Redosled u kojem se prikazuju u biracu
export const REACTIONS = ['LIKE', 'LOVE', 'LAUGH', 'WOW', 'SAD', 'FIRE'];

/* Svaka ikonica je 12 stringova po 12 znakova.
   '.' = providno, slovo = kljuc u `colors`. */
const ICONS = {
  LIKE: {
    colors: { a: '#f2b25c', b: '#a86a24' },
    rows: [
      '............',
      '...aa.......',
      '..aaaa......',
      '..aaaa......',
      '..aaaa......',
      'bbaaaaaaaa..',
      'bbaaaaaaaaa.',
      'bbaaaaaaaaa.',
      'bbaaaaaaaaa.',
      'bbaaaaaaaa..',
      '............',
      '............',
    ],
  },

  LOVE: {
    colors: { a: '#ff4d6d', b: '#ff97a8' },
    rows: [
      '............',
      '..aaa..aaa..',
      '.abbaaaaaaa.',
      'aabbaaaaaaaa',
      'aaaaaaaaaaaa',
      'aaaaaaaaaaaa',
      '.aaaaaaaaaa.',
      '..aaaaaaaa..',
      '...aaaaaa...',
      '....aaaa....',
      '.....aa.....',
      '............',
    ],
  },

  LAUGH: {
    colors: { c: '#ffd23f', d: '#2b1d0e' },
    rows: [
      '...dddddd...',
      '..dccccccd..',
      '.dccccccccd.',
      'dccccccccccd',
      'dccddccddccd',
      'dccccccccccd',
      'dccddddddccd',
      'dccddddddccd',
      'dccddddddccd',
      '.dccccccccd.',
      '..dccccccd..',
      '...dddddd...',
    ],
  },

  WOW: {
    colors: { c: '#ffd23f', d: '#2b1d0e' },
    rows: [
      '...dddddd...',
      '..dccccccd..',
      '.dccccccccd.',
      'dccddccddccd',
      'dccddccddccd',
      'dccccccccccd',
      'dccccddccccd',
      'dccccddccccd',
      'dccccddccccd',
      '.dccccccccd.',
      '..dccccccd..',
      '...dddddd...',
    ],
  },

  SAD: {
    colors: { c: '#ffd23f', d: '#2b1d0e', e: '#4da3ff' },
    rows: [
      '...dddddd...',
      '..dccccccd..',
      '.dccccccccd.',
      'dccdccccdccd',
      'dccdccccdccd',
      'dccccccccecd',
      'dccccccccecd',
      'dccdccccdccd',
      'dcccddddcccd',
      '.dccccccccd.',
      '..dccccccd..',
      '...dddddd...',
    ],
  },

  FIRE: {
    colors: { a: '#ff7a18', b: '#ffd166' },
    rows: [
      '.....aa.....',
      '....aaaa....',
      '....aaaa....',
      '...aaaaaa...',
      '...aabbaa...',
      '..aabbbbaa..',
      '..abbbbbba..',
      '.aabbbbbbaa.',
      '.aabbbbbbaa.',
      '.aabbbbbbaa.',
      '..aabbbbaa..',
      '...aaaaaa...',
    ],
  },
};

/* Mreza -> <rect> elementi. Susedni pikseli iste boje se spajaju u jedan
   pravougaonik, pa ikonica ima ~15 cvorova umesto 144. */
function toRects(rows, colors) {
  const rects = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.') {
        x += 1;
        continue;
      }
      let w = 1;
      while (row[x + w] === ch) w += 1;
      rects.push(
        <rect key={`${x}:${y}`} x={x} y={y} width={w} height={1} fill={colors[ch]} />
      );
      x += w;
    }
  });
  return rects;
}

/** Bilo koja 12x12 piksel mreza kao SVG. Koriste je i reakcije i reply strelica. */
export function PixelIcon({ rows, colors, size = 20, label }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      /* Bez ovoga browser antialiasuje ivice i piksel izgled se gubi */
      shapeRendering="crispEdges"
      style={{ display: 'block' }}
      role="img"
      aria-label={label}
    >
      {toRects(rows, colors)}
    </svg>
  );
}

export default function ReactionIcon({ type, size = 20 }) {
  const icon = ICONS[type];
  if (!icon) return null;
  return <PixelIcon rows={icon.rows} colors={icon.colors} size={size} label={type} />;
}
