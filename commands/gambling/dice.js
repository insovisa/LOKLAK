const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'dice',
    aliases: ['roll', 'd'],
    description: 'Roll dice and gamble your coins',
    usage: 'dice <amount> [number]',
    cooldown: 3000, // 3 seconds
    execute(message, args, client) {
        // Check arguments
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: 'Please provide a bet amount!\n**Usage:** `Kdice <amount> [1-6]`\n**Example:** `Kdice 1000 6` (bet on rolling a 6)',
                    timestamp: new Date()
                }]
            });
        }

        // Parse bet amount
        let betAmount = parseInt(args[0]);
        if (isNaN(betAmount) || betAmount <= 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Bet Amount',
                    description: 'Please provide a valid positive number.',
                    timestamp: new Date()
                }]
            });
        }

        // Check min/max bet
        const { minBet, maxBet } = config.gambling.dice;
        if (betAmount < minBet || betAmount > maxBet) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💸 Invalid Bet Range',
                    description: `Bet amount must be between **${minBet.toLocaleString()}** and **${maxBet.toLocaleString()}** ${config.economy.currency}.`,
                    timestamp: new Date()
                }]
            });
        }

        // Check if user has enough balance
        if (!database.hasBalance(message.author.id, betAmount)) {
            const userData = database.getUser(message.author.id);
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '💸 Insufficient Funds',
                    description: `You don't have enough ${config.economy.currency}!\n**Your Balance:** ${userData.balance.toLocaleString()} ${config.economy.currency}\n**Required:** ${betAmount.toLocaleString()} ${config.economy.currency}`,
                    timestamp: new Date()
                }]
            });
        }

        // Get user's number choice (1-6)
        let userChoice = null;
        if (args.length > 1) {
            const choice = parseInt(args[1]);
            if (choice >= 1 && choice <= 6) {
                userChoice = choice;
            }
        }

        // If no valid choice provided, use random
        if (!userChoice) {
            userChoice = Math.floor(Math.random() * 6) + 1;
        }

        // Remove bet amount from user's balance
        database.removeBalance(message.author.id, betAmount);
        database.updateStats(message.author.id, 'gambled', betAmount);

        // Dice emoji array
        const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        const diceAnimationFrames = ['🎲', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🎲 Dice Roll')
            .setDescription(`**Bet Amount:** ${betAmount.toLocaleString()} ${config.economy.currency}\n**Your Number:** ${userChoice}\n\n🎲 **Rolling dice...**`)
            .addFields({
                name: '🎯 How to Win',
                value: [
                    '🎯 **Exact Match:** x5 payout',
                    '🎲 **High Roll (4-6):** x2 payout', 
                    '📈 **Any Win:** Bonus XP'
                ].join('\n'),
                inline: true
            })
            .setFooter({ 
                text: `${message.author.username} is rolling dice`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        message.reply({ embeds: [embed] }).then(async (sentMessage) => {
            // Animate the rolling dice
            for (let i = 0; i < 5; i++) {
                await new Promise(resolve => setTimeout(resolve, 180));
                
                const animFrame = diceAnimationFrames[Math.floor(Math.random() * diceAnimationFrames.length)];
                
                const animationEmbed = new EmbedBuilder()
                    .setColor(colors.primary)
                    .setTitle('🎲 Dice Roll')
                    .setDescription(`**Bet Amount:** ${betAmount.toLocaleString()} ${config.economy.currency}\n**Your Number:** ${userChoice}\n\n${animFrame} **Rolling dice...**`)
                    .addFields({
                        name: '🎯 How to Win',
                        value: [
                            '🎯 **Exact Match:** x5 payout',
                            '🎲 **High Roll (4-6):** x2 payout',
                            '📈 **Any Win:** Bonus XP'
                        ].join('\n'),
                        inline: true
                    })
                    .setFooter({ 
                        text: `${message.author.username} is rolling dice`,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();

                try {
                    await sentMessage.edit({ embeds: [animationEmbed] });
                } catch (error) {
                    return; // Message might be deleted
                }
            }

            // Generate final result
            const diceResult = Math.floor(Math.random() * 6) + 1;
            const resultEmoji = diceEmojis[diceResult];

            let multiplier = 0;
            let winType = '';

            // Determine win conditions
            if (diceResult === userChoice) {
                // Exact match - highest payout
                multiplier = 5;
                winType = '🎯 Exact Match!';
            } else if (diceResult >= 4) {
                // High roll - smaller payout
                multiplier = 2;
                winType = '🎲 High Roll!';
            }

            let finalEmbed;
            
            if (multiplier > 0) {
                // User won
                const winAmount = betAmount * multiplier;
                const newBalance = database.addBalance(message.author.id, winAmount);
                database.updateStats(message.author.id, 'won', winAmount - betAmount);
                
                // Add experience for winning
                const expGain = database.addExperience(message.author.id, multiplier === 5 ? 30 : 15);

                finalEmbed = new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('🎉 You Won!')
                    .setDescription(`${resultEmoji} **You rolled a ${diceResult}!**\n\n${winType}`)
                    .addFields(
                        {
                            name: '💰 Winnings',
                            value: `+${winAmount.toLocaleString()} ${config.economy.currency}`,
                            inline: true
                        },
                        {
                            name: '💳 New Balance',
                            value: `${newBalance.toLocaleString()} ${config.economy.currency}`,
                            inline: true
                        },
                        {
                            name: '🔥 Multiplier',
                            value: `x${multiplier}`,
                            inline: true
                        },
                        {
                            name: '⭐ XP Gained',
                            value: `+${multiplier === 5 ? 30 : 15} XP`,
                            inline: true
                        }
                    );

                if (expGain.leveledUp) {
                    finalEmbed.addFields({
                        name: '🎉 Level Up!',
                        value: `Congratulations! You reached level **${expGain.newLevel}**!`,
                        inline: false
                    });
                }

                // Special message for exact match
                if (multiplier === 5) {
                    finalEmbed.setDescription(`${resultEmoji} **You rolled a ${diceResult}!**\n\n🌟 **PERFECT PREDICTION!** 🌟\n${winType}`);
                }
            } else {
                // User lost
                const userData = database.getUser(message.author.id);
                database.updateStats(message.author.id, 'lost', betAmount);

                finalEmbed = new EmbedBuilder()
                    .setColor(colors.error)
                    .setTitle('💸 No Luck This Time!')
                    .setDescription(`${resultEmoji} **You rolled a ${diceResult}**\n\nYou needed ${userChoice} for exact match or 4+ for high roll.`)
                    .addFields(
                        {
                            name: '💸 Lost',
                            value: `-${betAmount.toLocaleString()} ${config.economy.currency}`,
                            inline: true
                        },
                        {
                            name: '💳 Remaining Balance',
                            value: `${userData.balance.toLocaleString()} ${config.economy.currency}`,
                            inline: true
                        },
                        {
                            name: '🎯 Your Number',
                            value: `${userChoice}`,
                            inline: true
                        }
                    );
            }

            finalEmbed.addFields({
                name: '📊 Roll Summary',
                value: `**Your Guess:** ${userChoice}\n**Actual Roll:** ${diceResult}\n**Result:** ${multiplier > 0 ? 'WIN' : 'LOSE'}`,
                inline: false
            });

            finalEmbed.setFooter({ 
                text: `Game completed | Roll: ${diceResult}`,
                iconURL: message.author.displayAvatarURL()
            }).setTimestamp();

            // Update command usage statistics
            database.updateStats(message.author.id, 'command');

            try {
                await sentMessage.edit({ embeds: [finalEmbed] });
            } catch (error) {
                message.channel.send({ embeds: [finalEmbed] });
            }
        }).catch(error => {
            console.error('Error in dice animation:', error);
        });
    }
};
