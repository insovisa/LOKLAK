const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
// Use built-in fetch (Node.js 18+) or axios as fallback
const fetch = global.fetch || require('axios').get;

const TENOR_API_KEY = process.env.GOOGLE_API_KEY; // Use GOOGLE_API_KEY from environment variables

if (!TENOR_API_KEY) {
    console.error('GOOGLE_API_KEY is not defined. Please check your environment variables.');
}

module.exports = {
    name: 'jail',
    description: 'Send someone to jail.',
    usage: 'jail [@user] [message]',
    cooldown: 3000,
    async execute(message, args) {
        const mentionedUser = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');
        const sent = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary || 0x0099FF)
                .setTitle('🔒 Preparing jail...')
                .setDescription('Loading jail animation...')
            ]
        });

        if (!TENOR_API_KEY) {
            console.error('GOOGLE_API_KEY is not defined. Please check your environment variables.');
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.danger || 0xFF4444)
                    .setTitle('🔒 JAIL TIME!')
                    .setDescription(`**${mentionedUser?.username || message.author.username}** has been sent to jail! (No GIF available)`)
                ]
            });
            return;
        }

        try {
            let gifUrl = null;

            // First try Tenor API with randomization
            try {
                const query = 'jail handcuff arrest prison';
                const url = `https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(query)}&limit=10&random=true&media_filter=gif`;
                const response = await fetch(url);
                const data = global.fetch ? await response.json() : response.data;

                console.log('Tenor Response Status:', global.fetch ? response.status : response.status);
                console.log('Tenor Response Headers:', global.fetch ? response.headers : response.headers);

                if (data.results && Array.isArray(data.results) && data.results.length > 0) {
                    const randomIndex = Math.floor(Math.random() * data.results.length);
                    gifUrl = data.results[randomIndex].media_formats.gif.url;
                }
            } catch (e) {
                console.log('Tenor API failed:', e);
            }

            // Fallback to waifu.pics
            if (!gifUrl) {
                try {
                    const res2 = await fetch('https://api.waifu.pics/sfw/kill'); // Using kill as a close match
                    const data2 = global.fetch ? await res2.json() : res2.data;
                    console.log('Waifu.pics kill response:', data2);
                    if (data2 && data2.url) {
                        gifUrl = data2.url;
                    }
                } catch (e) {
                    console.log('Waifu.pics kill API failed:', e);
                }
            }

            const targetUser = mentionedUser || message.author;
            const embed = new EmbedBuilder()
                .setColor(colors.danger || 0xFF4444)
                .setTitle('🔒 JAIL TIME!')
                .setDescription(`**${targetUser.username}** has been sent to jail!${customMessage ? `\n\n💬 "${customMessage}"` : ''}`);

            if (gifUrl) {
                console.log('Using jail GIF URL:', gifUrl);
                embed.setImage(gifUrl);
            } else {
                console.log('No jail GIF found from any API');
            }

            await sent.edit({ embeds: [embed] });

        } catch (error) {
            console.error('Error in jail command:', error);
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.danger || 0xFF4444)
                    .setTitle('🔒 JAIL TIME!')
                    .setDescription(`**${mentionedUser?.username || message.author.username}** has been sent to jail! (No GIF available)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};