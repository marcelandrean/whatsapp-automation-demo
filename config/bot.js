import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const pkg = JSON.parse(fs.readFileSync("package.json"));

global.bot = {
  name: process.env.WHATSAPP_BOT_NAME || "WhatsApp Bot",
  number: "", // if not want add validation number
  version: pkg["version"],
  prefix: "!",
  splitArgs: "|",
  locale: "id",
  timezone: process.env.WHATSAPP_BOT_TIMEZONE || "Asia/Jakarta",
  adsUrl: process.env.WHATSAPP || "",
  newsletterJid: "",
  commands: (() => {
    return [];
  })(),
  setting: JSON.parse(fs.readFileSync("./config/setting.json")),
  saveSetting: function () {
    fs.writeFileSync(
      "./config/setting.json",
      JSON.stringify(global.bot.setting)
    );
    return global.bot.setting;
  },
  broadcast: {
    delay: 3000, // Default delay between broadcasts in ms
    maxPerDay: 100, // Maximum broadcasts per day to avoid bans
    lists: {}, // Store broadcast lists
  },
};

global.owner = {
  name: process.env.WHATSAPP_BOT_OWNER_NAME || "Owner",
  number: process.env.WHATSAPP_BOT_OWNER_NUMBER,
};

// global.db = {
//   user: [],
//   premium: [],
//   group: [],
//   save: async function(dbName) {}
// }
