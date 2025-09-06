const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config.js');
const colors = require('../../utils/colors.js');

module.exports = {
    name: 'info',
    aliases: ['botinfo', 'about'],
    description: 'Show bot information and statistics',
    usage: 'info',
    execute(message, args, client) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🤖 Bot Information')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: '📊 Statistics',
                    value: [
                        `**Servers:** ${client.guilds.cache.size}`,
                        `**Users:** ${client.users.cache.size}`,
                        `**Commands:** ${client.commands.size}`,
                        `**Uptime:** ${uptimeString}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '💻 System',
                    value: [
                        `**Node.js:** ${process.version}`,
                        `**Discord.js:** v14`,
                        `**Memory:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                        `**Platform:** ${process.platform}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎮 Bot Details',
                    value: [
                        `**Name:** ${config.botInfo.name}`,
                        `**Version:** ${config.botInfo.version}`,
                        `**Author:** ${config.botInfo.author}`,
                        `**Prefix:** K, k`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🌟 Features',
                    value: [
                        '• Animated gambling games (coinflip, slots, dice)',
                        '• Complete economy system with riel currency',
                        '• Hunting system with 7 rarity tiers',
                        '• Zoo collection system',
                        '• Expression GIF commands',
                        '• Admin moderation tools',
                        '• User profiles and statistics',
                        '• Daily/weekly rewards',
                        '• Booster system'
                    ].join('\n'),
                    inline: false
                }
            )
            
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
