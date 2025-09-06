const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'setbal',
    aliases: ['setbalance'],
    description: 'Set a user\'s balance (Admin only)',
    usage: 'setbal <@user> <amount>',
    adminOnly: true,
    execute(message, args, client) {
        // Check arguments
        if (args.length < 2) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: 'Please provide a user and amount.\n**Usage:** `Ksetbal @user <amount>`\n**Example:** `Ksetbal @user 10000`',
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

        // Parse amount
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount < 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Amount',
                    description: 'Please provide a valid positive number.',
                    timestamp: new Date()
                }]
            });
        }

        // Check maximum amount to prevent abuse
        const maxAmount = 9999999999999999999999; // Set a reasonable maximum balance limit
        if (amount > maxAmount) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '⚠️ Amount Too High',
                    description: `Maximum allowed balance is ${maxAmount.toLocaleString()} ${config.economy.currency}.`,
                    timestamp: new Date()
                }]
            });
        }

        // Get user data and previous balance
        const userData = database.getUser(target.id);
        const previousBalance = userData.balance;

        // Set new balance
        userData.balance = amount;
        database.saveUser(userData);

        const embed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('💰 Balance Updated')
            .setDescription(`Successfully updated **${target.username}**'s balance!`)
            .addFields(
                {
                    name: '👤 Target User',
                    value: [
                        `**Username:** ${target.username}`,
                        `**User ID:** ${target.id}`,
                        `**Account Age:** ${Math.floor((Date.now() - userData.joinedAt) / (1000 * 60 * 60 * 24))} days`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '💳 Balance Changes',
                    value: [
                        `**Previous:** ${previousBalance.toLocaleString()} ${config.economy.currency}`,
                        `**New:** ${amount.toLocaleString()} ${config.economy.currency}`,
                        `**Difference:** ${amount >= previousBalance ? '+' : ''}${(amount - previousBalance).toLocaleString()} ${config.economy.currency}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🔧 Admin Action',
                    value: [
                        `**Admin:** ${message.author.username}`,
                        `**Action:** Set Balance`,
                        `**Timestamp:** <t:${Math.floor(Date.now() / 1000)}:F>`
                    ].join('\n'),
                    inline: false
                }
            )
            .setThumbnail(target.displayAvatarURL())
            .setTimestamp();

        message.reply({ embeds: [embed] });

        // Log the admin action
        console.log(`[ADMIN] ${message.author.tag} set ${target.tag}'s balance to ${amount} (was ${previousBalance})`);
    }
};