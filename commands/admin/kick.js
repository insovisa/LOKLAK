const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const colors = require('../../utils/colors.js');

module.exports = {
    name: 'kick',
    aliases: ['kickuser'],
    description: 'Kick a user from the server (Admin only)',
    usage: 'kick <@user> [reason]',
    adminOnly: true,
    execute(message, args, client) {
        // Check if bot has kick permissions
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Missing Permissions',
                    description: 'I don\'t have permission to kick members in this server.',
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
                    description: 'Please provide a user to kick.\n**Usage:** `Kkick @user [reason]`\n**Example:** `Kkick @user Breaking rules`',
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

        // Prevent kicking yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤔 Self Kick',
                    description: 'You cannot kick yourself!',
                    timestamp: new Date()
                }]
            });
        }

        // Prevent kicking the bot
        if (target.id === client.user.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Protection',
                    description: 'I cannot kick myself!',
                    timestamp: new Date()
                }]
            });
        }

        // Check if target is kickable
        if (!member.kickable) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Cannot Kick User',
                    description: 'I cannot kick this user. They may have higher permissions than me.',
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
                    description: 'I cannot kick this user as they have a role equal to or higher than mine.',
                    timestamp: new Date()
                }]
            });
        }

        // Get member info before kicking
        const joinedAt = member.joinedTimestamp;
        const roles = member.roles.cache.filter(role => role.id !== message.guild.id).map(role => role.name).slice(0, 5);

        // Try to DM the user before kicking
        const dmEmbed = new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle('👢 You Have Been Kicked')
            .setDescription(`You have been kicked from **${message.guild.name}**.`)
            .addFields(
                {
                    name: 'Reason',
                    value: reason,
                    inline: false
                },
                {
                    name: 'Kicked By',
                    value: message.author.tag,
                    inline: true
                },
                {
                    name: 'Server',
                    value: message.guild.name,
                    inline: true
                }
            )
            .setFooter({ text: 'You can rejoin the server if you have an invite link.' })
            .setTimestamp();

        // Attempt to send DM (but don't let it fail the kick)
        target.send({ embeds: [dmEmbed] }).catch(() => {
            // User has DMs disabled or blocked the bot
        });

        // Kick the user
        member.kick(`${reason} | Kicked by: ${message.author.tag}`).then(() => {
            const successEmbed = new EmbedBuilder()
                .setColor(colors.success)
                .setTitle('👢 User Kicked Successfully')
                .setDescription(`**${target.tag}** has been kicked from the server.`)
                .addFields(
                    {
                        name: '👤 Kicked User',
                        value: [
                            `**Username:** ${target.username}`,
                            `**User ID:** ${target.id}`,
                            `**Joined Server:** <t:${Math.floor(joinedAt / 1000)}:R>`,
                            `**Account Created:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '📋 Kick Details',
                        value: [
                            `**Reason:** ${reason}`,
                            `**Kicked By:** ${message.author.tag}`,
                            `**Date:** <t:${Math.floor(Date.now() / 1000)}:F>`
                        ].join('\n'),
                        inline: true
                    }
                );

            if (roles.length > 0) {
                successEmbed.addFields({
                    name: '🎭 Previous Roles',
                    value: roles.join(', ') + (member.roles.cache.size > 6 ? `, +${member.roles.cache.size - 6} more` : ''),
                    inline: false
                });
            }

            successEmbed.setThumbnail(target.displayAvatarURL())
                .setFooter({ 
                    text: `Kick executed by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();

            message.reply({ embeds: [successEmbed] });

            // Log the kick
            console.log(`[KICK] ${message.author.tag} kicked ${target.tag} | Reason: ${reason}`);

        }).catch(error => {
            console.error('Error kicking user:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(colors.error)
                .setTitle('❌ Kick Failed')
                .setDescription(`Failed to kick **${target.tag}**.`)
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
