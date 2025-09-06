const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

const cooldown = new Set();
const COOLDOWN_TIME = 2 * 1000;

module.exports = {
    name: "blowjob",
    aliases: ["bj"],
    description: "NSFW: Give a blowjob to another user (18+)",
    usage: "blowjob @user",
    async execute(message, args) {
        if (!message.channel.nsfw) {
            return message.reply(
                "🚫 This command can only be used in NSFW-marked channels.",
            );
        }

        if (cooldown.has(message.author.id)) {
            return message.reply(
                "⏳ Wait a moment before using this command again.",
            );
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply("👉 Mention someone to give a blowjob.");
        }

        try {
            const res = await axios.get(
                "https://api.purrbot.site/v2/img/nsfw/blowjob/gif",
            );
            const imageUrl = res.data.link;

            const embed = new EmbedBuilder()
                .setTitle("🔞 NSFW Action: Blowjob")
                .setDescription(
                    `${message.author} is giving ${user} a blowjob 😳`,
                )
                .setImage(imageUrl)
                .setColor("Purple");

            message.channel.send({ embeds: [embed] });

            cooldown.add(message.author.id);
            setTimeout(() => cooldown.delete(message.author.id), COOLDOWN_TIME);
        } catch (err) {
            console.error(err);
            message.reply("❌ Couldn't get the GIF.");
        }
    },
};
