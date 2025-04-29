import {
  getContentType,
  isJidBroadcast,
  isJidGroup,
  isJidNewsletter,
  isJidUser,
  jidDecode,
  jidNormalizedUser,
} from "@whiskeysockets/baileys";
import cases from "../cases.js";

export default function messagesUpsert(bot, m) {
  if (!m.message) return;
  m.id = m.key.id;
  m.chatId = m.key.remoteJid;
  m.isGroup = isJidGroup(m.chatId);
  m.isPrivate = isJidUser(m.chatId);
  m.isStory = isJidBroadcast(m.chatId);
  m.isNewsletter = isJidNewsletter(m.chatId);
  m.senderId = m.isNewsletter
    ? ""
    : m.isGroup || m.isStory
    ? m.key.participant || jidNormalizedUser(m.participant)
    : m.key.remoteJid;
  m.fromMe = m.key.fromMe;
  m.isOwner = jidDecode(m.senderId).user === global.owner.number;
  m.type = getContentType(m.message);
  m.body =
    m.type === "conversation"
      ? m.message.conversation
      : m.message[m.type].caption ||
        m.message[m.type].text ||
        m.message[m.type].singleSelectReply?.selectedRowId ||
        m.message[m.type].selectedButtonId ||
        (m.message[m.type].nativeFlowResponseMessage?.paramsJson
          ? JSON.parse(m.message[m.type].nativeFlowResponseMessage.paramsJson)
              .id
          : "") ||
        "";
  m.text =
    m.type === "conversation"
      ? m.message.conversation
      : m.message[m.type].caption ||
        m.message[m.type].text ||
        m.message[m.type].description ||
        m.message[m.type].title ||
        m.message[m.type].contentType ||
        m.message[m.type].selectedDisplayText ||
        "";
  m.isCommand = m.body.trim().startsWith(global.bot.prefix);
  m.cmd = m.body
    .trim()
    .normalize("NFKC")
    .replace(global.bot.prefix, "")
    .split(" ")[0]
    .toLowerCase();
  m.args = m.body
    .trim()
    .replace(/^\S*\b/g, "")
    .split(global.bot.splitArgs)
    .map((arg) => arg.trim())
    .filter((arg) => arg);
  m.reply = (text) =>
    bot.sendMessage(
      m.chatId,
      { text },
      {
        quoted: {
          key: {
            id: m.id,
            fromMe: false,
            remoteJid: "status@broadcast",
            participant: "0@s.whatsapp.net",
          },
          message: { conversation: `💬 ${m.text}` },
        },
      }
    );

  // Enhanced message functions
  m.sendText = async (number, text) => {
    const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
    return bot.sendMessage(jid, { text });
  };

  m.sendMessage = async (number, message, options = {}) => {
    const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
    return bot.sendMessage(jid, message, options);
  };

  m.sendMedia = async (number, mediaUrl, caption = "") => {
    const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
    try {
      const response = await axios.get(mediaUrl, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(response.data);

      // Determine media type from URL
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(mediaUrl);
      const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(mediaUrl);
      const isAudio = /\.(mp3|ogg|wav|m4a)$/i.test(mediaUrl);

      if (isImage) {
        return bot.sendMessage(jid, { image: buffer, caption });
      } else if (isVideo) {
        return bot.sendMessage(jid, { video: buffer, caption });
      } else if (isAudio) {
        return bot.sendMessage(jid, { audio: buffer });
      } else {
        // Default to document
        const fileName = mediaUrl.split("/").pop();
        return bot.sendMessage(jid, {
          document: buffer,
          fileName: fileName || "file",
          mimetype: "application/octet-stream",
          caption,
        });
      }
    } catch (error) {
      console.error("Error sending media:", error);
      throw error;
    }
  };

  m.sendImage = async (number, imagePathOrBuffer, caption = "") => {
    const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
    let buffer;

    if (typeof imagePathOrBuffer === "string") {
      // Check if it's a URL or file path
      if (imagePathOrBuffer.startsWith("http")) {
        const response = await axios.get(imagePathOrBuffer, {
          responseType: "arraybuffer",
        });
        buffer = Buffer.from(response.data);
      } else {
        // It's a file path
        buffer = await fs.promises.readFile(imagePathOrBuffer);
      }
    } else if (Buffer.isBuffer(imagePathOrBuffer)) {
      buffer = imagePathOrBuffer;
    } else {
      throw new Error(
        "Invalid image source. Must be a file path, URL, or Buffer"
      );
    }

    return bot.sendMessage(jid, { image: buffer, caption });
  };

  m.sendVideo = async (number, videoPathOrBuffer, caption = "") => {
    const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
    let buffer;

    if (typeof videoPathOrBuffer === "string") {
      // Check if it's a URL or file path
      if (videoPathOrBuffer.startsWith("http")) {
        const response = await axios.get(videoPathOrBuffer, {
          responseType: "arraybuffer",
        });
        buffer = Buffer.from(response.data);
      } else {
        // It's a file path
        buffer = await fs.promises.readFile(videoPathOrBuffer);
      }
    } else if (Buffer.isBuffer(videoPathOrBuffer)) {
      buffer = videoPathOrBuffer;
    } else {
      throw new Error(
        "Invalid video source. Must be a file path, URL, or Buffer"
      );
    }

    return bot.sendMessage(jid, { video: buffer, caption });
  };

  m.sendAudio = async (number, audioPathOrBuffer) => {
    const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
    let buffer;

    if (typeof audioPathOrBuffer === "string") {
      // Check if it's a URL or file path
      if (audioPathOrBuffer.startsWith("http")) {
        const response = await axios.get(audioPathOrBuffer, {
          responseType: "arraybuffer",
        });
        buffer = Buffer.from(response.data);
      } else {
        // It's a file path
        buffer = await fs.promises.readFile(audioPathOrBuffer);
      }
    } else if (Buffer.isBuffer(audioPathOrBuffer)) {
      buffer = audioPathOrBuffer;
    } else {
      throw new Error(
        "Invalid audio source. Must be a file path, URL, or Buffer"
      );
    }

    return bot.sendMessage(jid, {
      audio: buffer,
      mimetype: "audio/mp4",
      ptt: false, // set to true for voice note
    });
  };

  m.sendFile = async (number, filePathOrBuffer, fileName = "") => {
    const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
    let buffer;
    let name = fileName;

    if (typeof filePathOrBuffer === "string") {
      // Check if it's a URL or file path
      if (filePathOrBuffer.startsWith("http")) {
        const response = await axios.get(filePathOrBuffer, {
          responseType: "arraybuffer",
        });
        buffer = Buffer.from(response.data);
        if (!name) name = filePathOrBuffer.split("/").pop();
      } else {
        // It's a file path
        buffer = await fs.promises.readFile(filePathOrBuffer);
        if (!name) name = filePathOrBuffer.split("/").pop();
      }
    } else if (Buffer.isBuffer(filePathOrBuffer)) {
      buffer = filePathOrBuffer;
      if (!name) name = "file";
    } else {
      throw new Error(
        "Invalid file source. Must be a file path, URL, or Buffer"
      );
    }

    return bot.sendMessage(jid, {
      document: buffer,
      fileName: name,
      mimetype: "application/octet-stream",
    });
  };

  m.sendPoll = async (number, text, poll) => {
    const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
    return bot.sendMessage(jid, {
      poll: {
        name: text,
        values: poll,
        selectableCount: 1,
      },
    });
  };

  m.sendLocation = async (number, latitude, longitude, caption = "") => {
    const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
    return bot.sendMessage(jid, {
      location: {
        degreesLatitude: latitude,
        degreesLongitude: longitude,
        caption: caption,
      },
    });
  };

  m.sendContact = async (number, contactNumber, displayName) => {
    const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
    const vcard = `
      BEGIN:VCARD
      VERSION:3.0
      FN:${displayName}
      TEL;type=CELL;waid=${contactNumber}:${contactNumber}
      END:VCARD
    `.trim();

    return bot.sendMessage(jid, {
      contacts: {
        displayName: displayName,
        contacts: [{ vcard }],
      },
    });
  };

  m.sendPresenceUpdate = async (presence) => {
    return bot.sendPresenceUpdate(presence, m.chatId);
  };

  // Add simplified methods for current chat
  m.replyWithImage = async (imagePathOrBuffer, caption = "") => {
    return m.sendImage(m.chatId, imagePathOrBuffer, caption);
  };

  m.replyWithVideo = async (videoPathOrBuffer, caption = "") => {
    return m.sendVideo(m.chatId, videoPathOrBuffer, caption);
  };

  m.replyWithAudio = async (audioPathOrBuffer) => {
    return m.sendAudio(m.chatId, audioPathOrBuffer);
  };

  m.replyWithFile = async (filePathOrBuffer, fileName = "") => {
    return m.sendFile(m.chatId, filePathOrBuffer, fileName);
  };

  m.replyWithPoll = async (text, poll) => {
    return m.sendPoll(m.chatId, text, poll);
  };

  m.replyWithLocation = async (latitude, longitude, caption = "") => {
    return m.sendLocation(m.chatId, latitude, longitude, caption);
  };

  m.replyWithContact = async (contactNumber, displayName) => {
    return m.sendContact(m.chatId, contactNumber, displayName);
  };

  return cases(bot, m);
}
