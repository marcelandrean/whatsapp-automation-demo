/**
 * Broadcasts a message to multiple recipients
 * @param {Object} m - Message object with sending methods
 * @param {Array<string>} numbers - Array of recipient numbers
 * @param {string} message - Text message to send
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Results of broadcast operations
 */
export async function broadcastText(m, numbers, message, options = {}) {
  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const number of numbers) {
    try {
      await m.sendText(number, message);
      results.push({ number, status: "success" });
      successCount++;
    } catch (error) {
      console.error(`Failed to send message to ${number}:`, error);
      results.push({ number, status: "failed", error: error.message });
      failCount++;
    }

    // Wait a bit between messages to avoid rate limiting
    if (options.delay) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }
  }

  return {
    total: numbers.length,
    success: successCount,
    failed: failCount,
    results,
  };
}

/**
 * Broadcasts media to multiple recipients
 * @param {Object} m - Message object with sending methods
 * @param {Array<string>} numbers - Array of recipient numbers
 * @param {string|Buffer} media - Media to send (URL, path, or buffer)
 * @param {string} caption - Optional caption
 * @param {string} type - Media type (image, video, audio, file)
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Results of broadcast operations
 */
export async function broadcastMedia(
  m,
  numbers,
  media,
  caption = "",
  type = "image",
  options = {}
) {
  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const number of numbers) {
    try {
      switch (type.toLowerCase()) {
        case "image":
          await m.sendImage(number, media, caption);
          break;
        case "video":
          await m.sendVideo(number, media, caption);
          break;
        case "audio":
          await m.sendAudio(number, media);
          break;
        case "file":
          await m.sendFile(number, media, options.fileName || "");
          break;
        default:
          await m.sendImage(number, media, caption);
      }

      results.push({ number, status: "success" });
      successCount++;
    } catch (error) {
      console.error(`Failed to send media to ${number}:`, error);
      results.push({ number, status: "failed", error: error.message });
      failCount++;
    }

    // Wait a bit between messages to avoid rate limiting
    if (options.delay) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }
  }

  return {
    total: numbers.length,
    success: successCount,
    failed: failCount,
    results,
  };
}

export default {
  broadcastText,
  broadcastMedia,
};
