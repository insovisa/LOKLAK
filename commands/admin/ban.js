const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const colors = require('../../utils/colors.js');

module.exports = {
    name: 'ban',
    aliases: ['banuser'],
    description: 'Ban a user from the server (Admin only)',
    usage: 'ban <@user> [reason]',
    adminOnly: true,
    execute(message, args, client) {
        // Check if bot has ban permissions
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Missing Permissions',
                    description: 'I don\'t have permission to ban members in this server.',
                    timestamp: new Date()
                }]
            });
        }

        // Check arguments
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: 'Please provide a user to ban.\n**Usage:** `Kban @user [reason]`\n**Example:** `Kban @user Spamming`',
                    timestamp: new Date()
                }]
            });
        }

        // Get target user
        let target = null;
        if (message.mentions.users.size > 0) {
            target = message.mentions.users.first();
        } else {
            const userId = args[0];
            target = client.users.cache.get(userId);
        }

        if (!target) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ User Not Found',
                    description: 'Please mention a valid user or provide their user ID.',
                    timestamp: new Date()
                }]
            });
        }

        // Get reason
        const reason = args.slice(1).join(' ') || 'No reason provided';

        // Check if user is in the guild
        const member = message.guild.members.cache.get(target.id);
        
        if (!member) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '⚠️ User Not in Server',
                    description: 'This user is not a member of this server.',
                    timestamp: new Date()
                }]
            });
        }

        // Prevent banning yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤔 Self Ban',
                    description: 'You cannot ban yourself!',
                    timestamp: new Date()
                }]
            });
        }

        // Prevent banning the bot
        if (target.id === client.user.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Protection',
                    description: 'I cannot ban myself!',
                    timestamp: new Date()
                }]
            });
        }

        // Check if target is bannable
        if (!member.bannable) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Cannot Ban User',
                    description: 'I cannot ban this user. They may have higher permissions than me.',
                    timestamp: new Date()
                }]
            });
        }

        // Check role hierarchy
        if (member.roles.highest.position >= message.guild.members.me.roles.highest.position) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Insufficient Role Hierarchy',
                    description: 'I cannot ban this user as they have a role equal to or higher than mine.',
                    timestamp: new Date()
                }]
            });
        }

        // Try to DM the user before banning
        const dmEmbed = new EmbedBuilder()
            .setColor(colors.error)
            .setTitle('🔨 You Have Been Banned')
            .setDescription(`You have been banned from **${message.guild.name}**.`)
            .addFields(
                {
                    name: 'Reason',
                    value: reason,
                    inline: false
                },
                {
                    name: 'Banned By',
                    value: message.author.tag,
                    inline: true
                },
                {
                    name: 'Server',
                    value: message.guild.name,
                    inline: true
                }
            )
            .setFooter({ text: 'If you believe this was a mistake, contact the server administrators.' })
            .setTimestamp();

        // Attempt to send DM (but don't let it fail the ban)
        target.send({ embeds: [dmEmbed] }).catch(() => {
            // User has DMs disabled or blocked the bot
        });

        // Ban the user
        member.ban({ 
            reason: `${reason} | Banned by: ${message.author.tag}`,
            deleteMessageDays: 1 // Delete messages from last 1 day
        }).then(() => {
            const successEmbed = new EmbedBuilder()
                .setColor(colors.success)
                .setTitle('🔨 User Banned Successfully')
                .setDescription(`**${target.tag}** has been banned from the server.`)
                .addFields(
                    {
                        name: '👤 Banned User',
                        value: [
                            `**Username:** ${target.username}`,
                            `**User ID:** ${target.id}`,
                            `**Account Created:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '📋 Ban Details',
                        value: [
                            `**Reason:** ${reason}`,
                            `**Banned By:** ${message.author.tag}`,
                            `**Date:** <t:${Math.floor(Date.now() / 1000)}:F>`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🗑️ Message Cleanup',
                        value: 'Messages from the last 1 day have been deleted.',
                        inline: false
                    }
                )
                .setThumbnail(target.displayAvatarURL())
                .setTimestamp();

            message.reply({ embeds: [successEmbed] });

            // Log the ban
            console.log(`[BAN] ${message.author.tag} banned ${target.tag} | Reason: ${reason}`);

        }).catch(error => {
            console.error('Error banning user:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(colors.error)
                .setTitle('❌ Ban Failed')
                .setDescription(`Failed to ban **${target.tag}**.`)
                .addFields({
                    name: 'Error',
                    value: error.message || 'Unknown error occurred',
                    inline: false
                })
                .setTimestamp();

            message.reply({ embeds: [errorEmbed] });
        });
    }
};
