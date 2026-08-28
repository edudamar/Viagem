export async function compressImage(dataUrl: string, maxWidth = 600, quality = 0.4): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = (h * maxWidth) / w;
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function compressFotos(fotos: string[], maxTotal = 3800): Promise<string[]> {
  const compressed: string[] = [];
  let totalSize = 0;

  for (const foto of fotos) {
    if (totalSize >= maxTotal) break;

    let compressedFoto = await compressImage(foto, 600, 0.4);
    if (compressedFoto.length + totalSize > maxTotal) {
      compressedFoto = await compressImage(foto, 400, 0.3);
    }
    if (compressedFoto.length + totalSize > maxTotal) {
      compressedFoto = await compressImage(foto, 300, 0.2);
    }
    if (compressedFoto.length + totalSize <= maxTotal) {
      compressed.push(compressedFoto);
      totalSize += compressedFoto.length;
    }
  }

  return compressed;
}

export function generateSyncCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function compressForQR(data: unknown): string {
  const json = JSON.stringify(data);
  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(json);
    const compressed = deflate(bytes);
    return btoa(String.fromCharCode(...compressed));
  } catch {
    return btoa(unescape(encodeURIComponent(json)));
  }
}

function deflate(data: Uint8Array): Uint8Array {
  const output: number[] = [];
  let i = 0;
  while (i < data.length) {
    const byte = data[i];
    if (byte < 128) {
      output.push(byte);
      i++;
    } else {
      let runLength = 2;
      while (runLength < 58 && i + runLength < data.length && data[i + runLength] === byte) {
        runLength++;
      }
      if (runLength >= 3) {
        output.push(0x80, runLength - 3, byte);
        i += runLength;
      } else {
        output.push(byte);
        i++;
      }
    }
  }
  return new Uint8Array(output);
}
