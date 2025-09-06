const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
// Use built-in fetch (Node.js 18+) or axios as fallback
const fetch = global.fetch || require('axios').get;

module.exports = {
    name: 'thank',
    description: 'Express your gratitude!',
    usage: 'thank [message]',
    cooldown: 3000,
    async execute(message, args) {
        const customMessage = args.join(' ');
        const sent = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary || 0x0099FF)
                .setTitle('🙏 Thanking...')
                .setDescription('Loading gratitude...')
            ]
        });

        try {
            let gifUrl = null;

            // First try to fetch from nekos.best (no direct thank, using smile)
            try {
                const res1 = await fetch('https://nekos.best/api/v2/smile');
                const data1 = await res1.json();
                console.log('Nekos.best smile response:', data1);
                if (data1 && data1.results && data1.results.length > 0 && data1.results[0].url) {
                    gifUrl = data1.results[0].url;
                } else if (data1 && data1.url) {
                    gifUrl = data1.url;
                }
            } catch (e) {
                console.log('Nekos.best smile API failed:', e);
            }

            // Fallback to waifu.pics
            if (!gifUrl) {
                try {
                    const res2 = await fetch('https://api.waifu.pics/sfw/smile');
                    const data2 = await res2.json();
                    console.log('Waifu.pics smile response:', data2);
                    if (data2 && data2.url) {
                        gifUrl = data2.url;
                    }
                } catch (e) {
                    console.log('Waifu.pics smile API failed:', e);
                }
            }

            const embed = new EmbedBuilder()
                .setColor(colors.success || 0x00FF00)
                .setTitle('🙏 Thank You!')
                .setDescription(`**${message.author.username}** is grateful!${customMessage ? `\n\n💬 "${customMessage}"` : ''}`);

            if (gifUrl) {
                console.log('Using thank GIF URL:', gifUrl);
                embed.setImage(gifUrl);
            } else {
                console.log('No thank GIF found from any API');
            }

            await sent.edit({ embeds: [embed] });

        } catch (error) {
            console.error('Error in thank command:', error);
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.danger || 0xFF4444)
                    .setTitle('🙏 Thank You!')
                    .setDescription(`**${message.author.username}** is grateful! (No GIF 😢)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};