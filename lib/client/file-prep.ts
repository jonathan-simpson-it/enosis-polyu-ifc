export interface PreparedFile {
  file: File;
  downscaled: boolean;
}

export interface FilePrepError {
  error: string;
}

// Vercel Hobby serverless functions cap request bodies at 4.5MB. Keep a
// margin: anything over 4MB is rejected before it leaves the browser.
const MAX_BODY_BYTES = 4 * 1024 * 1024;

// Server-side vision downscales to 1000px (lib/engine/vision.ts); do the same
// client-side so phone photos stay under the body limit and upload faster.
const MAX_IMAGE_DIMENSION = 1000;

/**
 * Prepare a file for upload: downscale images in the browser and reject
 * anything that would blow the platform request-body cap.
 */
export async function prepareUploadFile(file: File): Promise<PreparedFile | FilePrepError> {
  if (file.type.startsWith("image/")) {
    const prepared = await downscaleImage(file);
    if ("error" in prepared) return prepared;
    if (prepared.file.size > MAX_BODY_BYTES) {
      return {
        error:
          "This image is still too large after compression. Please upload a smaller image (under 4MB).",
      };
    }
    return prepared;
  }

  if (file.size > MAX_BODY_BYTES) {
    return {
      error: "Files over 4MB can't be processed by the free tier. Please upload a smaller file.",
    };
  }

  return { file, downscaled: false };
}

async function downscaleImage(file: File): Promise<PreparedFile | FilePrepError> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
    if (scale >= 1 && file.size <= MAX_BODY_BYTES) {
      bitmap.close();
      return { file, downscaled: false };
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return { error: "Could not prepare this image for upload." };
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    if (!blob) return { error: "Could not compress this image for upload." };

    const name = file.name.replace(/\.(png|webp|bmp|tiff?|heic)$/i, ".jpg") || "image.jpg";
    return { file: new File([blob], name, { type: "image/jpeg" }), downscaled: true };
  } catch {
    if (file.size > MAX_BODY_BYTES) {
      return { error: "This image is too large to upload. Please resize it below 4MB." };
    }
    return { file, downscaled: false };
  }
}
