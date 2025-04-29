import "./config/bot.js";
import {
  makeWASocket,
  useMultiFileAuthState,
  isJidNewsletter,
} from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import question from "./utils/question.js";
import messagesUpsert from "./events/messages.upsert.js";

(async function start(usePairingCode = true) {
  const session = await useMultiFileAuthState("session");

  const bot = makeWASocket({
    printQRInTerminal: !usePairingCode,
    auth: session.state,
    logger: pino({ level: "silent" }).child({ level: "silent" }),
    shouldIgnoreJid: (jid) => isJidNewsletter(jid),
  });

  if (usePairingCode && !bot.user && !bot.authState.creds.registered) {
    if (
      await (async () => {
        return (
          (
            await question("Do you want to connect using pairing code? [Y/n]: ")
          ).toLowerCase() === "n"
        );
      })()
    )
      return start(false);

    const waNumber = await question("Enter your WhatsApp number: +");
    const code = await bot.requestPairingCode(waNumber.replace(/\D/g, ""));
    console.log(`\x1b[44;1m\x20PAIRING CODE\x20\x1b[0m\x20${code}`);
  }

  bot.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      console.log(lastDisconnect.error);
      const { statusCode, error } = lastDisconnect.error.output.payload;

      if (statusCode === 401 && error === "Unauthorized") {
        await fs.promises.rm("session", { recursive: true, force: true });
      }

      return start();
    }

    if (connection === "open") {
      // Validate WhatsApp number
      if (
        global.bot.number &&
        global.bot.number !== bot.user.id.split(":")[0]
      ) {
        console.log(
          `\x1b[35;1mThis number doesn't have access to use this whatsapp bot script\x1b[0m\n-> PLEASE ORDER THIS SCRIPT FROM ${global.owner.name} WA ${global.owner.number}`
        );
        return process.exit();
      }
      console.log("Successfully connected with: " + bot.user.id.split(":")[0]);
    }
  });

  bot.ev.on("creds.update", async () => {
    session.saveCreds();
  });

  bot.ev.on("messages.upsert", ({ messages }) => {
    messagesUpsert(bot, messages[0]);
  });
})();
