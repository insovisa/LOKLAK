const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

const cooldown = new Set();
const COOLDOWN_TIME = 2000; // 2 seconds

module.exports = {
    name: "pussylick",
    aliases: ["lickpussy", "pl"],
    description: "NSFW: Lick someone's pussy (18+)",
    usage: "pussylick @user",
    async execute(message, args) {
        if (!message.channel.nsfw) {
            return message.reply("🚫 This command can only be used in NSFW channels.");
        }

        if (cooldown.has(message.author.id)) {
            return message.reply("⏳ Please wait before using this command again.");
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply("👉 Mention someone to lick.");
        }

        try {
            // Use Purrbot NSFW API
            const res = await axios.get("https://api.purrbot.site/v2/img/nsfw/pussylick/gif");
            const imageUrl = res.data.link; // Purrbot API returns the image URL in 'link' field

            const embed = new EmbedBuilder()
                .setTitle("🔞 NSFW Action: Pussy Lick")
                .setDescription(`${message.author} is licking ${user}'s pussy 😳💦`)
                .setImage(imageUrl)
                .setColor("DarkVividPink");

            message.channel.send({ embeds: [embed] });

            cooldown.add(message.author.id);
            setTimeout(() => cooldown.delete(message.author.id), COOLDOWN_TIME);
        } catch (err) {
            console.error("API Error:", err.message);
            message.reply("❌ Couldn't fetch the image from Purrbot API.");
        }
    },
};