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
  { id: 'girl-pretty-in-pink', name: 'Pretty in Pink', gender: 'girl', art: 'assets/match-frenzy-pretty-in-pink.webp' },
  { id: 'girl-lily-explorer', name: 'Lily Explorer', gender: 'girl', art: 'assets/match-frenzy-lily-explorer.png' },
  { id: 'boy-vegas-hottie', name: 'Vegas Boy Frog', gender: 'boy', art: 'assets/match-frenzy-street-star.webp' },
  { id: 'boy-beach-breeze', name: 'Beach Breeze', gender: 'boy', art: 'assets/match-frenzy-beach-breeze.webp' },
  { id: 'boy-cool-explorer', name: 'Cool Explorer', gender: 'boy', art: 'assets/match-frenzy-cool-explorer.webp' }
];

const HSL_TARGETS = new Map(MOBILE_BODY_COLORS.filter(color => !color.rainbow).map(color => [color.id, color]));
const SKIN_TONE_TRANSFORMS = {
  ivory: { scale: 0.48, offset: 0.45 },
  tan: { scale: 0.7, offset: 0.2 },
  chestnut: { scale: 0.72, offset: 0.09 },
  deep: { scale: 0.62, offset: 0.02 }
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

function recolorHair(h, s, l, color, nx, ny) {
  if (color.id === 'blonde') return null;
  const hue = color.rainbow ? (nx * 360 + ny * 120) % 360 : color.hue;
  const saturation = color.rainbow ? Math.max(0.66, s) : color.saturation;
  let lightness = l * (color.lightness ?? 1);
  if (color.id === 'black') lightness = Math.min(0.3, Math.max(0.09, lightness));
  else lightness = Math.min(0.88, Math.max(0.16, lightness));
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
  if (hair.id === 'blonde' && body.id === 'green') return avatar.art;
  const key = `${avatar.id}|${hair.id}|${body.id}`;
  if (imageCache.has(key)) return imageCache.get(key);
  if (pendingImages.has(key)) return pendingImages.get(key);

  const pending = (async () => {
    const image = await loadImage(avatar.art);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frame.data;
    const width = canvas.width, height = canvas.height;
    for (let y = 0; y < height; y++) {
      const ny = y / height;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (pixels[i + 3] < 24) continue;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        const [h, s, l] = rgbToHsl(r, g, b);
        const nx = x / width;
        const crownHair = nx > 0.05 && nx < 0.95 && ny > 0.03 && ny < 0.32;
        const sideHair = ny > 0.16 && ny < (avatar.gender === 'girl' ? 0.62 : 0.36) && (nx < 0.39 || nx > 0.61);
        const fringeHair = ny >= 0.27 && ny < 0.33 && nx > 0.32 && nx < 0.68;
        const faceFeatures = nx > 0.34 && nx < 0.66 && ny >= 0.32 && ny < 0.45;
        const hairRegion = (crownHair || sideHair || fringeHair) && !faceFeatures;
        const isHair = hairRegion && s > 0.03 && h >= 5 && h <= 92 && r >= g * 0.72;
        const skinRegion = nx > 0.025 && nx < 0.975 && ny > 0.07 && ny < 0.97;
        const isGreenSkin = skinRegion && g > r + 3 && g > b + 2 && h >= 62 && h <= 170 && s > 0.08;
        let replacement = null;
        // Green pixels belong to exposed frog skin even when the hue overlaps the hair range.
        if (isGreenSkin) replacement = recolorBody(h, s, l, body, nx, ny);
        else if (isHair) replacement = recolorHair(h, s, l, hair, nx, ny);
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
