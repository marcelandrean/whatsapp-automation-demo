import Ai4Chat from "./scrape/Ai4Chat.js";
import fs from "fs";
import axios from "axios";
import path from "path";
import { broadcastText, broadcastMedia } from "./utils/broadcast.js";
import dotenv from "dotenv";
dotenv.config();

/**
 * Handles command routing for the WhatsApp bot
 *
 * Processes incoming messages and routes them to appropriate handler functions
 * based on the command specified in the message.
 *
 * Available commands:
 * - menu: Displays a welcome message
 * - ping: Responds with "Pong!"
 * - demo: Demonstrates different message types (text, image, poll, location, contact)
 * - ai: Processes AI requests using Ai4Chat
 * - broadcast/bc: Sends messages to multiple recipients (owner only)
 * - bclist: Reserved for broadcasting to saved contact lists (owner only)
 *
 * @param {Object} bot - The WhatsApp bot instance
 * @param {Object} m - The message object containing command details
 * @param {string} m.cmd - The command name
 * @param {string} m.senderId - Sender's WhatsApp ID
 * @param {Array<string>} m.args - Command arguments
 * @param {Function} m.reply - Function to reply to the message
 * @param {boolean} m.isOwner - Whether the sender is the bot owner
 * @returns {Promise<void>}
 */
export default async function cases(bot, m) {
  console.log(m);
  try {
    switch (m.cmd) {
      case "menu":
        await bot.sendMessage(m.senderId, {
          text: "Hello, this is the menu command",
        });
        break;

      case "ping":
        m.reply("Pong!");
        break;

      case "demo":
        m.reply("🚀 Demonstrating different message types...");

        setTimeout(async () => {
          try {
            // Send text
            await m.reply("This is a simple text message");

            // Send an image
            const imageResponse = await axios.get("https://picsum.photos/800", {
              responseType: "arraybuffer",
            });
            await m.replyWithImage(
              Buffer.from(imageResponse.data),
              "This is a random image caption"
            );

            // Send a poll
            await m.replyWithPoll("What's your favorite color?", [
              "Red",
              "Blue",
              "Green",
              "Yellow",
            ]);

            // Send location
            await m.replyWithLocation(-6.1754, 106.8272, "Jakarta, Indonesia");

            // Send contact
            await m.replyWithContact(global.owner.number, global.owner.name);

            if (process.env.WHATSAPP_BOT_DEMO_NUMBER) {
              await m.replyWithContact(
                process.env.WHATSAPP_BOT_DEMO_NUMBER,
                process.env.WHATSAPP_BOT_DEMO_NAME || "Demo Target"
              );
            }

            // Send presence update
            // Show "typing..." before sending a text message
            await m.sendPresenceUpdate("composing");

            // Show "recording audio.." indicator
            // await m.sendPresenceUpdate("composing");

            // Send direct message to owner (for demonstration)
            if (m.senderId !== global.owner.number + "@s.whatsapp.net") {
              await m.sendText(
                global.owner.number,
                `User ${m.senderId} is testing the demo command`
              );
            }
          } catch (error) {
            console.error("Demo error:", error);
            m.reply(`Error in demo: ${error.message}`);
          }
        }, 1000);
        break;

      case "ai":
        if (m.args.length === 0) {
          m.reply("What would you like to ask the AI?");
          return;
        }
        try {
          const prompt = m.args.join(" ");
          Ai4Chat(prompt)
            .then((response) => {
              let resultText;
              if (typeof response === "string") {
                resultText = response;
              } else if (typeof response === "object" && response.result) {
                resultText = response.result;
              } else {
                throw new Error("Unsupported Format");
              }

              m.reply(resultText);
            })
            .catch((error) => {
              console.error("Error:", error);
              m.reply(`An error occurred: ${error.message}`);
            });
        } catch (error) {
          console.error("Error:", error);
          m.reply(`An error occurred: ${error.message}`);
        }
        break;

      case "broadcast":
      case "bc":
        // Check if user is owner
        if (!m.isOwner) {
          m.reply("Sorry, only the owner can use broadcast commands");
          return;
        }

        // Check broadcast args format
        if (m.args.length < 2) {
          m.reply(
            `*Broadcast Command*\n\nFormat: !broadcast number1,number2,number3|message`
          );
          return;
        }

        const broadcastType = "text";
        const numbersStr = m.args[0];
        const recipients = numbersStr
          .split(",")
          .map((num) => num.trim().replace(/^0/, "62"));

        if (recipients.length === 0) {
          m.reply("Please provide at least one recipient number");
          return;
        }

        if (broadcastType === "text") {
          if (m.args.length < 2) {
            m.reply("Please provide a message to broadcast");
            return;
          }

          const broadcastMessage = m.args.slice(1).join(" ");
          m.reply(
            `Broadcasting text message to ${recipients.length} recipients...`
          );

          broadcastText(m, recipients, broadcastMessage, { delay: 1000 })
            .then((result) => {
              m.reply(
                `Broadcast completed:\n✅ Successful: ${result.success}\n❌ Failed: ${result.failed}\n📊 Total: ${result.total}`
              );
            })
            .catch((error) => {
              console.error("Broadcast error:", error);
              m.reply(`Broadcast error: ${error.message}`);
            });
        } else if (
          ["image", "video", "audio", "file"].includes(broadcastType)
        ) {
          if (m.args.length < 4) {
            m.reply(`Please provide a caption and ${broadcastType} URL/path`);
            return;
          }

          const caption = m.args[2];
          const mediaUrl = m.args[3];

          m.reply(
            `Broadcasting ${broadcastType} to ${recipients.length} recipients...`
          );

          broadcastMedia(m, recipients, mediaUrl, caption, broadcastType, {
            delay: 1500,
          })
            .then((result) => {
              m.reply(
                `Broadcast completed:\n✅ Successful: ${result.success}\n❌ Failed: ${result.failed}\n📊 Total: ${result.total}`
              );
            })
            .catch((error) => {
              console.error("Broadcast error:", error);
              m.reply(`Broadcast error: ${error.message}`);
            });
        } else {
          m.reply(
            `Unsupported broadcast type: ${broadcastType}. Supported types: text, image, video, audio, file`
          );
        }
        break;

      case "bclist":
        // Command to broadcast to a saved list
        if (!m.isOwner) {
          m.reply("Sorry, only the owner can use broadcast commands");
          return;
        }

        // We can implement this to use a saved group or list from the database
        // For now, let's give an example of how it would work
        m.reply(
          "This command would broadcast to a saved list of contacts. Implement this by storing contact lists in your database."
        );
        break;
    }
  } catch (err) {
    console.log(err);
    m.reply("*ERROR:* " + err.message);
  }
}
