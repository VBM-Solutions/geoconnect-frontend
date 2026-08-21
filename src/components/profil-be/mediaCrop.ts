export interface CropPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const clampPan = (value: number) => Math.max(-1, Math.min(1, value));

export function panAfterDrag(initial: number, deltaPixels: number, renderedSize: number, overflowRatio: number): number {
  if (overflowRatio <= 0 || renderedSize <= 0) return initial;
  return clampPan(initial + deltaPixels * 2 / renderedSize / overflowRatio);
}

export function calculateCropPlacement(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  zoom: number,
  panX: number,
  panY: number,
): CropPlacement {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight) * zoom;
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const overflowX = Math.max(0, width - targetWidth);
  const overflowY = Math.max(0, height - targetHeight);
  return {
    x: (targetWidth - width) / 2 + panX * overflowX / 2,
    y: (targetHeight - height) / 2 + panY * overflowY / 2,
    width,
    height,
  };
}

const encode = (canvas: HTMLCanvasElement, quality: number) => new Promise<Blob>((resolve, reject) => {
  canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Impossible de générer l’image.')), 'image/webp', quality);
});

export async function cropImage(
  image: HTMLImageElement,
  type: 'LOGO' | 'BANNIERE',
  zoom: number,
  panX: number,
  panY: number,
): Promise<File> {
  const [targetWidth, targetHeight, maxBytes] = type === 'LOGO'
    ? [512, 512, 1024 * 1024]
    : [1600, 400, 4 * 1024 * 1024];
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Le recadrage n’est pas pris en charge par ce navigateur.');
  const placement = calculateCropPlacement(
    image.naturalWidth, image.naturalHeight, targetWidth, targetHeight, zoom, panX, panY,
  );
  context.drawImage(image, placement.x, placement.y, placement.width, placement.height);

  let quality = .92;
  let blob = await encode(canvas, quality);
  while (blob.size > maxBytes && quality > .42) {
    quality -= .1;
    blob = await encode(canvas, quality);
  }
  if (blob.size > maxBytes) throw new Error(`L’image optimisée dépasse encore ${type === 'LOGO' ? '1 Mo' : '4 Mo'}.`);
  return new File([blob], type === 'LOGO' ? 'logo.webp' : 'bandeau.webp', { type: 'image/webp' });
}
