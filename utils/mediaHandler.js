import fs from "fs";
import path from "path";
import axios from "axios";
import { fileTypeFromBuffer } from "file-type";

/**
 * Fetch media from URL
 * @param {string} url - Media URL
 * @returns {Promise<Buffer>} Media buffer
 */
export async function fetchMedia(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  } catch (error) {
    console.error("Error fetching media:", error);
    throw new Error(`Failed to fetch media: ${error.message}`);
  }
}

/**
 * Get media from path or URL
 * @param {string|Buffer} source - Path, URL or Buffer
 * @returns {Promise<Buffer>} Media buffer
 */
export async function getMediaBuffer(source) {
  if (Buffer.isBuffer(source)) {
    return source;
  }

  if (typeof source !== "string") {
    throw new Error("Invalid source. Must be a file path, URL, or Buffer");
  }

  // Check if it's a URL
  if (source.startsWith("http")) {
    return fetchMedia(source);
  }

  // It's a file path
  try {
    return await fs.promises.readFile(source);
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

/**
 * Save buffer to file
 * @param {Buffer} buffer - Media buffer
 * @param {string} filename - Target filename
 * @returns {Promise<string>} File path
 */
export async function saveBuffer(buffer, filename) {
  const mediaDir = path.join(process.cwd(), "media");

  // Create media directory if it doesn't exist
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  const filePath = path.join(mediaDir, filename);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
}

/**
 * Determine media type from buffer
 * @param {Buffer} buffer - Media buffer
 * @returns {Promise<string>} Media type
 */
export async function getMediaType(buffer) {
  try {
    const type = await fileTypeFromBuffer(buffer);
    if (!type) return "unknown";

    if (type.mime.startsWith("image/")) return "image";
    if (type.mime.startsWith("video/")) return "video";
    if (type.mime.startsWith("audio/")) return "audio";

    return "document";
  } catch (error) {
    return "unknown";
  }
}

/**
 * Get file name from path or URL
 * @param {string} source - Path or URL
 * @returns {string} Filename
 */
export function getFileName(source) {
  if (typeof source !== "string") return "file";
  return source.split("/").pop().split("\\").pop();
}

export default {
  fetchMedia,
  getMediaBuffer,
  saveBuffer,
  getMediaType,
  getFileName,
};
