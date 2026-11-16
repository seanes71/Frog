export const MOBILE_HAIR_COLORS = [
  { id: 'red', name: 'Red', hue: 2, saturation: 0.78, lightness: 0.92 },
  { id: 'brown', name: 'Brown', hue: 24, saturation: 0.62, lightness: 0.67 },
  { id: 'blonde', name: 'Blonde', hue: 43, saturation: 0.68, lightness: 1 },
  { id: 'black', name: 'Black', hue: 268, saturation: 0.16, lightness: 0.36 },
  { id: 'blue', name: 'Blue', hue: 207, saturation: 0.78, lightness: 1 },
  { id: 'purple', name: 'Purple', hue: 270, saturation: 0.72, lightness: 1 },
  { id: 'pink', name: 'Pink', hue: 332, saturation: 0.72, lightness: 1 },
  { id: 'teal', name: 'Teal', hue: 174, saturation: 0.72, lightness: 1 },
  { id: 'rainbow', name: 'Rainbow', rainbow: true, lightness: 1 }
];

// Natural frog colors plus a welcoming range of human skin tones.
export const MOBILE_BODY_COLORS = [
  { id: 'green', name: 'Green Hopper', swatch: '#78d93b', hue: 101, saturation: 0.72 },
  { id: 'ivory', name: 'Ivory Glow', swatch: '#f0ddc5', hue: 34, saturation: 0.24, skinTone: 'ivory' },
  { id: 'tan', name: 'Warm Tan', swatch: '#d7ae86', hue: 30, saturation: 0.42, skinTone: 'tan' },
  { id: 'chestnut', name: 'Chestnut', swatch: '#a66d49', hue: 24, saturation: 0.48, skinTone: 'chestnut' },
  { id: 'deep-cocoa', name: 'Deep Cocoa', swatch: '#563a31', hue: 18, saturation: 0.42, skinTone: 'deep' },
  { id: 'olive', name: 'Olive Grove', swatch: '#8b9b43', hue: 76, saturation: 0.64 },
  { id: 'teal', name: 'Pond Teal', swatch: '#38b9aa', hue: 174, saturation: 0.66 },
  { id: 'blue', name: 'Blue Splash', swatch: '#57a8f4', hue: 207, saturation: 0.7 },
  { id: 'purple', name: 'Purple Punch', swatch: '#a77be3', hue: 270, saturation: 0.67 },
  { id: 'pink', name: 'Pink Petal', swatch: '#ef7cb4', hue: 333, saturation: 0.68 },
  { id: 'gold', name: 'Golden Glow', swatch: '#e8b33d', hue: 43, saturation: 0.72 },
  { id: 'red', name: 'Red Rocket', swatch: '#e75e55', hue: 4, saturation: 0.72 },
  { id: 'rainbow', name: 'Rainbow Leap', swatch: 'linear-gradient(115deg,#ff5353,#ffc847,#63d26f,#54b7ff,#ac6cff)', rainbow: true }
];

export const MOBILE_AVATARS = [
  { id: 'vegas-cards', name: 'Vegas Cards Cutie', gender: 'girl', art: 'assets/match-frenzy-country-cutie.webp' },
  { id: 'girl-sweetheart-overalls', name: 'Sweetheart Overalls', gender: 'girl', art: 'assets/match-frenzy-sweetheart-overalls.png' },
  { id: 'girl-sunshine-dress', name: 'Sunshine Dress', gender: 'girl', art: 'assets/match-frenzy-sunshine-dress.webp' },
  { id: 'girl-denim-classic', name: 'Denim Classic', gender: 'girl', art: 'assets/match-frenzy-denim-classic.png' },
  { id: 'girl-pretty-in-pink', name: 'Pretty in Pink', gender: 'girl', originalHair: 'brown', art: 'assets/match-frenzy-pretty-in-pink.webp' },
  { id: 'girl-lily-explorer', name: 'Lily Explorer', gender: 'girl', art: 'assets/match-frenzy-lily-explorer.png' },
  { id: 'boy-vegas-hottie', name: 'Vegas Boy Frog', gender: 'boy', art: 'assets/match-frenzy-street-star.webp' },
  { id: 'boy-beach-breeze', name: 'Beach Breeze', gender: 'boy', art: 'assets/match-frenzy-beach-breeze.webp' },
  { id: 'boy-cool-explorer', name: 'Cool Explorer', gender: 'boy', art: 'assets/match-frenzy-cool-explorer.webp' }
];

const HAIR_ART_STEMS = {
  'vegas-cards': 'country-cutie',
  'girl-sweetheart-overalls': 'sweetheart-overalls',
  'girl-sunshine-dress': 'sunshine-dress',
  'girl-denim-classic': 'denim-classic',
  'girl-pretty-in-pink': 'pretty-in-pink',
  'girl-lily-explorer': 'lily-explorer',
  'boy-vegas-hottie': 'street-star',
  'boy-beach-breeze': 'beach-breeze',
  'boy-cool-explorer': 'cool-explorer'
};
const FULL_HAIR_VARIANTS = new Set(['red', 'blue', 'green', 'purple', 'pink', 'rainbow']);

const HSL_TARGETS = new Map(MOBILE_BODY_COLORS.filter(color => !color.rainbow).map(color => [color.id, color]));
const SKIN_TONE_TRANSFORMS = {
  ivory: { scale: 0.48, offset: 0.45 },
  tan: { scale: 0.7, offset: 0.2 },
  chestnut: { scale: 0.72, offset: 0.09 },
  deep: { scale: 0.62, offset: 0.02 }
};
const HAIR_PROFILES = {
  girl: {
    crown: [0.06, 0.94, 0.02, 0.33],
    leftSide: [0.02, 0.36, 0.12, 0.72],
    rightSide: [0.64, 0.98, 0.12, 0.72],
    face: [0.50, 0.40, 0.33, 0.19],
    hairFaceStart: 0.37
  },
  boy: {
    crown: [0.08, 0.92, 0.02, 0.31],
    leftSide: [0.02, 0.37, 0.14, 0.43],
    rightSide: [0.63, 0.98, 0.14, 0.43],
    face: [0.50, 0.40, 0.32, 0.18],
    hairFaceStart: 0.36
  },
  'boy-vegas-hottie': {
    crown: [0.43, 0.98, 0.02, 0.29],
    leftSide: [1, 0, 1, 0],
    rightSide: [0.66, 0.98, 0.13, 0.41],
    face: [0.50, 0.40, 0.32, 0.18],
    hairFaceStart: 0.36
  },
  'boy-cool-explorer': {
    crown: [0.60, 0.97, 0.02, 0.32],
    leftSide: [1, 0, 1, 0],
    rightSide: [0.69, 0.98, 0.13, 0.43],
    face: [0.50, 0.40, 0.32, 0.18],
    faceCover: [0.08, 0.60, 0.28, 0.34],
    hairFaceStart: 0.36
  },
  'boy-beach-breeze': {
    crown: [0.08, 0.92, 0.02, 0.30],
    leftSide: [0.02, 0.40, 0.14, 0.47],
    rightSide: [0.60, 0.98, 0.14, 0.47],
    face: [0.50, 0.40, 0.32, 0.18],
    hairFaceStart: 0.36
  },
  'girl-lily-explorer': {
    crown: [1, 0, 1, 0],
    leftSide: [0.02, 0.37, 0.16, 0.70],
    rightSide: [0.63, 0.98, 0.16, 0.70],
    face: [0.50, 0.40, 0.33, 0.19],
    hairFaceStart: 0.37
  }
};
const imageCache = new Map();
const pendingImages = new Map();
const MAX_CACHED_ART = 18;

export function mobileAvatar(id) {
  return MOBILE_AVATARS.find(avatar => avatar.id === id) || MOBILE_AVATARS[0];
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return [((h + 360) % 360), s, l];
}

function inBox(nx, ny, box) {
  return nx >= box[0] && nx <= box[1] && ny >= box[2] && ny <= box[3];
}

function hairArtPlan(avatar, hair) {
  const stem = HAIR_ART_STEMS[avatar.id];
  if (!stem) return { src: avatar.art, recolor: false };
  const blondeVariant = hair.id === 'blonde' && avatar.originalHair === 'brown';
  const exactVariant = blondeVariant ? 'gold' : (FULL_HAIR_VARIANTS.has(hair.id) ? hair.id : null);
  if (exactVariant) return { src: `assets/match-frenzy-${stem}-hair-${exactVariant}.png`, recolor: false };
  if (hair.id === 'blonde') return { src: avatar.art, recolor: false };
  if (['brown', 'black', 'teal'].includes(hair.id)) {
    return { src: `assets/match-frenzy-${stem}-hair-red.png`, recolor: true, redBase: true };
  }
  return { src: avatar.art, recolor: true, redBase: false };
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let rgb;
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return rgb.map(channel => Math.round((channel + m) * 255));
}

function recolorHair(h, s, l, color, nx, ny, avatar) {
  const hue = color.rainbow ? (nx * 360 + ny * 120) % 360 : color.hue;
  const saturation = color.id === 'blonde'
    ? Math.max(0.42, Math.min(0.72, s * 0.76))
    : color.rainbow ? Math.max(0.66, s) : color.saturation;
  let lightness = color.id === 'blonde' ? l * 1.18 + 0.02 : l * (color.lightness ?? 1);
  if (color.id === 'black') lightness = Math.min(0.3, Math.max(0.09, lightness));
  else lightness = Math.min(color.id === 'blonde' ? 0.9 : 0.88, Math.max(color.id === 'blonde' ? 0.34 : 0.16, lightness));
  return hslToRgb(hue, color.id === 'black' ? Math.min(0.22, s * 0.4) : Math.max(saturation, s * 0.82), lightness);
}

function recolorBody(h, s, l, color, nx, ny) {
  if (color.id === 'green') return null;
  if (color.skinTone) {
    const tone = SKIN_TONE_TRANSFORMS[color.skinTone];
    const lightness = Math.min(0.88, Math.max(0.2, l * tone.scale + tone.offset));
    const saturation = Math.min(color.saturation, Math.max(0.18, s * 0.56));
    return hslToRgb(color.hue, saturation, lightness);
  }
  const hue = color.rainbow ? (nx * 300 + ny * 65) % 360 : color.hue;
  const saturation = color.rainbow ? Math.max(0.58, s) : Math.max(color.saturation, Math.min(0.86, s * 1.08));
  return hslToRgb(hue, saturation, Math.min(0.83, Math.max(0.2, l)));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load avatar art: ${src}`));
    image.src = src;
    if (image.complete && image.naturalWidth) resolve(image);
  });
}

export async function mobileAvatarArtUrl(id, hairId, bodyId) {
  const avatar = mobileAvatar(id);
  const hair = MOBILE_HAIR_COLORS.find(color => color.id === hairId) || MOBILE_HAIR_COLORS[2];
  const body = MOBILE_BODY_COLORS.find(color => color.id === bodyId) || MOBILE_BODY_COLORS[0];
  const hairPlan = hairArtPlan(avatar, hair);
  if (body.id === 'green' && !hairPlan.recolor) return hairPlan.src;
  const key = `${avatar.id}|${hair.id}|${body.id}`;
  if (imageCache.has(key)) return imageCache.get(key);
  if (pendingImages.has(key)) return pendingImages.get(key);

  const pending = (async () => {
    const image = await loadImage(hairPlan.src);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frame.data;
    const width = canvas.width, height = canvas.height;
    const profile = HAIR_PROFILES[avatar.id] || HAIR_PROFILES[avatar.gender] || HAIR_PROFILES.girl;
    const [faceX, faceY, faceRadiusX, faceRadiusY] = profile.face;
    for (let y = 0; y < height; y++) {
      const ny = y / height;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (pixels[i + 3] < 24) continue;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        const [h, s, l] = rgbToHsl(r, g, b);
        const nx = x / width;
        const faceFeatures = ny >= (profile.hairFaceStart ?? 0.36) && ((nx - faceX) / faceRadiusX) ** 2 + ((ny - faceY) / faceRadiusY) ** 2 < 1;
        const hairRegion = (inBox(nx, ny, profile.crown) || inBox(nx, ny, profile.leftSide) || inBox(nx, ny, profile.rightSide)) && !faceFeatures;
        const isRedReferenceHair = (h <= 28 || h >= 332) && s > 0.12;
        const isOriginalHair = s > 0.03 && h >= 5 && h <= 72 && r >= g * 0.78;
        const isHair = hairPlan.recolor && hairRegion && (hairPlan.redBase ? isRedReferenceHair : isOriginalHair);
        const skinRegion = nx > 0.025 && nx < 0.975 && ny > 0.07 && ny < 0.97;
        const faceMuzzleRegion = nx > 0.25 && nx < 0.75 && ny > 0.28 && ny < 0.52;
        const faceCover = profile.faceCover && inBox(nx, ny, profile.faceCover);
        const isFaceSkin = faceMuzzleRegion && !faceCover && !isHair && h >= 20 && h <= 175 && s > 0.16 && g > b * 1.02;
        const isGreenSkin = (skinRegion && g > r + 3 && g > b + 2 && h >= 78 && h <= 170 && s > 0.16) || isFaceSkin;
        let replacement = null;
        // Green pixels belong to exposed frog skin even when the hue overlaps the hair range.
        if (isGreenSkin) replacement = recolorBody(h, s, l, body, nx, ny);
        else if (isHair) replacement = recolorHair(h, s, l, hair, nx, ny, avatar);
        if (replacement) {
          pixels[i] = replacement[0];
          pixels[i + 1] = replacement[1];
          pixels[i + 2] = replacement[2];
        }
      }
    }
    context.putImageData(frame, 0, 0);
    const result = canvas.toDataURL('image/png');
    imageCache.set(key, result);
    if (imageCache.size > MAX_CACHED_ART) imageCache.delete(imageCache.keys().next().value);
    return result;
  })();
  pendingImages.set(key, pending);
  try {
    return await pending;
  } finally {
    pendingImages.delete(key);
  }
}
