const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'pay',
    aliases: ['give', 'transfer'],
    description: 'Pay coins to another user',
    usage: 'pay <@user> <amount>',
    cooldown: 5, // 5 second cooldown to prevent spam
    async execute(message, args, client) {
        // Check if user provided enough arguments
        if (args.length < 2) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: 'Please provide a user and amount to pay.\n**Usage:** `Kpay @user <amount>`',
                    timestamp: new Date()
                }]
            });
        }

        // Get target user
        let target = null;
        if (message.mentions.users.size > 0) {
            target = message.mentions.users.first();
        } else {
            // Try to find by ID
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

        // Can't pay yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤔 Self Payment',
                    description: 'You cannot pay yourself! That would be silly.',
                    timestamp: new Date()
                }]
            });
        }

        // Can't pay bots
        if (target.bot) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Payment',
                    description: 'You cannot pay bots. They don\'t need money!',
                    timestamp: new Date()
                }]
            });
        }

        // Parse amount - handle 'all' or 'max' keywords
        let amount;
        if (args[1].toLowerCase() === 'all' || args[1].toLowerCase() === 'max') {
            const senderData = database.getUser(message.author.id);
            amount = senderData.balance;
        } else {
            amount = parseInt(args[1]);
        }

        if (isNaN(amount) || amount <= 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Amount',
                    description: 'Please provide a valid positive number, or use "all" to pay your entire balance.',
                    timestamp: new Date()
                }]
            });
        }

        // Check minimum payment amount
        if (amount < 1) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💸 Minimum Payment',
                    description: `Minimum payment amount is 1 ${config.economy.currency}.`,
                    timestamp: new Date()
                }]
            });
        }

        // Get sender data
        const senderData = database.getUser(message.author.id);

        // Check if sender has enough balance
        if (!database.hasBalance(message.author.id, amount)) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '💸 Insufficient Funds',
                    description: `You don't have enough ${config.economy.currency}!\n**Your Balance:** ${senderData.balance.toLocaleString()} ${config.economy.currency}\n**Required:** ${amount.toLocaleString()} ${config.economy.currency}`,
                    timestamp: new Date()
                }]
            });
        }

        // Determine maximum payment limit based on user level
        const senderLevel = senderData.level || 1; // Default to level 1 if not set
        let maxPayment;

        if (senderLevel < 5) {
            maxPayment = 250000;
        } else if (senderLevel < 10) {
            maxPayment = 250000; // No additional amount for levels 5-9
        } else if (senderLevel < 15) {
            maxPayment = 750000; // 250k + 500k
        } else {
            maxPayment = 1500000; // 250k + 500k + 750k = Maximum amount
        }

        // Check maximum payment limit (prevent abuse)
        if (amount > maxPayment) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💰 Payment Limit Exceeded',
                    description: `You can only pay up to ${maxPayment.toLocaleString()} ${config.economy.currency} based on your level (${senderLevel}).\n\n**Level Limits:**\n• Levels 1-4: 250,000\n• Levels 5-9: 250,000\n• Levels 10-14: 750,000\n• Level 15+: 1,500,000`,
                    timestamp: new Date()
                }]
            });
        }

        try {
            // Process the payment
            const senderNewBalance = database.removeBalance(message.author.id, amount);
            const recipientNewBalance = database.addBalance(target.id, amount);

            // Log the transaction (if you have a transaction logging system)
            if (database.logTransaction) {
                database.logTransaction({
                    type: 'payment',
                    from: message.author.id,
                    to: target.id,
                    amount: amount,
                    timestamp: new Date(),
                    guild: message.guild.id
                });
            }

            // Create success embed
            const successEmbed = new EmbedBuilder()
                .setColor(colors.success)
                .setTitle('💸 Payment Successful')
                .setDescription(`**${message.author.username}** paid **${target.username}** ${amount.toLocaleString()} ${config.economy.currency}!`)
                .addFields(
                    {
                        name: '💰 Your New Balance',
                        value: `${senderNewBalance.toLocaleString()} ${config.economy.currency}`,
                        inline: true
                    },
                    {
                        name: '🎯 Recipient\'s New Balance',
                        value: `${recipientNewBalance.toLocaleString()} ${config.economy.currency}`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `Transaction ID: ${Date.now()}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });

            // Send confirmation message
            message.reply({ embeds: [successEmbed] });

            // Optional: Send DM notification to recipient
            if (config.economy.notifyRecipient !== false) {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(colors.success)
                        .setTitle('💰 You Received Payment!')
                        .setDescription(`**${message.author.username}** sent you ${amount.toLocaleString()} ${config.economy.currency}`)
                        .addFields({
                            name: '💳 Your New Balance',
                            value: `${recipientNewBalance.toLocaleString()} ${config.economy.currency}`,
                            inline: true
                        })
                        .setTimestamp()
                        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

                    await target.send({ embeds: [dmEmbed] });
                } catch (error) {
                    // Recipient has DMs disabled or bot can't send DM
                    console.log(`Could not send payment notification to ${target.username}: ${error.message}`);
                }
            }

        } catch (error) {
            console.error('Error processing payment:', error);

            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Payment Failed',
                    description: 'An error occurred while processing the payment. Please try again later.',
                    timestamp: new Date()
                }]
            });
        }
    }
};