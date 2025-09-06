const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');

module.exports = {
    name: 'avatar',
    aliases: ['av', 'pfp'],
    description: 'Show a user\'s avatar',
    usage: 'avatar [@user]',
    execute(message, args, client) {
        // Get target user (mentioned user or message author)
        let target = message.author;
        
        if (message.mentions.users.size > 0) {
            target = message.mentions.users.first();
        } else if (args.length > 0) {
            // Try to find user by ID or username
            const userId = args[0];
            const foundUser = client.users.cache.get(userId) || 
                             client.users.cache.find(user => 
                                 user.username.toLowerCase().includes(args[0].toLowerCase()) ||
                                 user.tag.toLowerCase().includes(args[0].toLowerCase())
                             );
            if (foundUser) target = foundUser;
        }

        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`🖼️ ${target.username}'s Avatar`)
            .setImage(target.displayAvatarURL({ size: 1024, dynamic: true }))
            .addFields(
                {
                    name: '👤 User Info',
                    value: [
                        `**Username:** ${target.username}`,
                        `**Discriminator:** #${target.discriminator}`,
                        `**ID:** ${target.id}`,
                        `**Created:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`
                    ].join('\n'),
                    inline: true
                }
            )
            .setFooter({ 
                text: `Requested by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
