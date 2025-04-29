import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("package.json"));

global.bot = {
  name: "Marcel Andrean",
  number: "", // if not want add validation number
  version: pkg["version"],
  prefix: "!",
  splitArgs: "|",
  locale: "id",
  timezone: "Asia/Jakarta",
  adsUrl: "https://instagram.com/username",
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
  name: "Marcel Andrean",
  number: "62xxxxxxxxxx",
};

// global.db = {
//   user: [],
//   premium: [],
//   group: [],
//   save: async function(dbName) {}
// }
