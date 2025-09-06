const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

const cooldown = new Set();
const COOLDOWN_TIME = 2 * 1000;

module.exports = {
    name: "fuck",
    aliases: ["f"],
    description: "NSFW: Have sex with another user (18+)",
    usage: "fuck @user",
    async execute(message, args) {
        if (!message.channel.nsfw) {
            return message.reply("🚫 This command can only be used in NSFW-marked channels.");
        }

        if (cooldown.has(message.author.id)) {
            return message.reply("⏳ Wait a moment before using this command again.");
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply("👉 Mention someone to fuck.");
        }

        try {
            const res = await axios.get("https://api.purrbot.site/v2/img/nsfw/fuck/gif");
            const imageUrl = res.data.link;

            const embed = new EmbedBuilder()
                .setTitle("🔞 NSFW Action: Fuck")
                .setDescription(`${message.author} is fucking ${user} 🔥`)
                .setImage(imageUrl)
                .setColor("DarkRed");

            message.channel.send({ embeds: [embed] });

            cooldown.add(message.author.id);
            setTimeout(() => cooldown.delete(message.author.id), COOLDOWN_TIME);
        } catch (err) {
            console.error(err);
            message.reply("❌ Couldn't get the GIF.");
        }
    },
};
