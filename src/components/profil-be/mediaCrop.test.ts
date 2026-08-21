import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateCropPlacement, clampPan, cropImage, panAfterDrag } from './mediaCrop';

describe('mediaCrop', () => {
  afterEach(() => vi.restoreAllMocks());

  it('calcule un placement couvrant la cible et applique le déplacement', () => {
    expect(calculateCropPlacement(1000, 500, 500, 500, 1, 1, 0)).toEqual({ x: 0, y: 0, width: 1000, height: 500 });
    expect(calculateCropPlacement(500, 1000, 500, 500, 2, 0, -1)).toEqual({ x: -250, y: -1500, width: 1000, height: 2000 });
  });

  it('convertit un glissement en position normalisée et la borne', () => {
    expect(panAfterDrag(0, 32, 320, 2)).toBe(.1);
    expect(panAfterDrag(0, 32, 0, 2)).toBe(0);
    expect(panAfterDrag(.5, 32, 320, 0)).toBe(.5);
    expect(clampPan(2)).toBe(1);
    expect(clampPan(-2)).toBe(-1);
  });

  it('génère les formats finaux logo et bandeau', async () => {
    const drawImage = vi.fn();
    const canvas = { width: 0, height: 0, getContext: vi.fn(() => ({ drawImage })), toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['ok'], { type: 'image/webp' }))) } as unknown as HTMLCanvasElement;
    vi.spyOn(document, 'createElement').mockReturnValue(canvas);
    const image = { naturalWidth: 1200, naturalHeight: 600 } as HTMLImageElement;

    const logo = await cropImage(image, 'LOGO', 1, 0, 0);
    expect(logo.name).toBe('logo.webp');
    expect(canvas.width).toBe(512);
    const banner = await cropImage(image, 'BANNIERE', 1, 0, 0);
    expect(banner.name).toBe('bandeau.webp');
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(400);
    expect(drawImage).toHaveBeenCalledTimes(2);
  });

  it('signale un canvas indisponible et un encodage impossible', async () => {
    vi.spyOn(document, 'createElement').mockReturnValue({ getContext: () => null } as unknown as HTMLCanvasElement);
    await expect(cropImage({} as HTMLImageElement, 'LOGO', 1, 0, 0)).rejects.toThrow('navigateur');

    vi.restoreAllMocks();
    vi.spyOn(document, 'createElement').mockReturnValue({ getContext: () => ({ drawImage: vi.fn() }), toBlob: (callback: BlobCallback) => callback(null) } as unknown as HTMLCanvasElement);
    await expect(cropImage({ naturalWidth: 10, naturalHeight: 10 } as HTMLImageElement, 'LOGO', 1, 0, 0)).rejects.toThrow('générer');
  });

  it('réduit la qualité puis refuse un résultat restant trop lourd', async () => {
    const qualities: number[] = [];
    const canvas = { getContext: () => ({ drawImage: vi.fn() }), toBlob: (callback: BlobCallback, _type: string, quality: number) => { qualities.push(quality); callback(new Blob([new Uint8Array(1024 * 1024 + 1)])); } } as unknown as HTMLCanvasElement;
    vi.spyOn(document, 'createElement').mockReturnValue(canvas);

    await expect(cropImage({ naturalWidth: 10, naturalHeight: 10 } as HTMLImageElement, 'LOGO', 1, 0, 0)).rejects.toThrow('dépasse encore 1 Mo');
    expect(qualities.length).toBeGreaterThan(1);
  });
});
