const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'coinflip',
    aliases: ['cf', 'flip'],
    description: 'Flip a coin and gamble your coins',
    usage: 'coinflip <amount/all> [heads/tails]',
    cooldown: 3000, // 3 seconds
    execute(message, args, client) {
        // Check arguments
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: 'Please provide a bet amount!\n**Usage:** `Kcoinflip <amount/all> [heads/tails]`\n**Example:** `Kcf 1000 heads` or `Kcf all tails`',
                    timestamp: new Date()
                }]
            });
        }

        let betAmount;
        let isAllBet = false;
        const userData = database.getUser(message.author.id);

        // Check if user wants to bet "all"
        if (args[0].toLowerCase() === 'all') {
            isAllBet = true;
            const { maxBet } = config.gambling.coinflip;
            // Use the smaller value between user's balance and maxBet cap
            betAmount = Math.min(userData.balance, maxBet);

            if (betAmount <= 0) {
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '💸 No Balance',
                        description: `You don't have any ${config.economy.currency} to bet!`,
                        timestamp: new Date()
                    }]
                });
            }
        } else {
            // Parse specific bet amount
            betAmount = parseInt(args[0]);
            if (isNaN(betAmount) || betAmount <= 0) {
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '❌ Invalid Bet Amount',
                        description: 'Please provide a valid positive number or use "all".',
                        timestamp: new Date()
                    }]
                });
            }
        }

        // Check minimum bet requirement for both cases
        const { minBet, maxBet } = config.gambling.coinflip;
        if (betAmount < minBet) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💸 Minimum Bet Required',
                    description: `Minimum bet amount is **${minBet.toLocaleString()}** ${config.economy.currency}.`,
                    timestamp: new Date()
                }]
            });
        }

        // Apply max bet restriction ONLY when using "all"
        if (isAllBet && betAmount > maxBet) {
            betAmount = maxBet;
        }
        // For specific number bets, no max restriction - only check if user has enough balance

        // Check if user has enough balance
        if (!database.hasBalance(message.author.id, betAmount)) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '💸 Insufficient Funds',
                    description: `You don't have enough ${config.economy.currency}!\n**Your Balance:** ${userData.balance.toLocaleString()} ${config.economy.currency}\n**Required:** ${betAmount.toLocaleString()} ${config.economy.currency}`,
                    timestamp: new Date()
                }]
            });
        }

        // Get user's choice (heads or tails)
        let userChoice = 'heads'; // default
        const choiceArgIndex = isAllBet ? 1 : 1; // Choice is always the second argument
        if (args.length > choiceArgIndex) {
            const choice = args[choiceArgIndex].toLowerCase();
            if (choice === 'tails' || choice === 't') {
                userChoice = 'tails';
            } else if (choice === 'heads' || choice === 'h') {
                userChoice = 'heads';
            }
        }

        // Remove bet amount from user's balance
        database.removeBalance(message.author.id, betAmount);
        database.updateStats(message.author.id, 'gambled', betAmount);

        // Animation frames for spinning coin
        const frames = ['🪙', '⚪', '🪙', '⚪', '🪙', '⚪', '🪙'];
        let frameIndex = 0;

        // Add bet type indicator in the description
        const betTypeText = isAllBet ? ` (${betAmount >= maxBet ? 'Max Bet' : 'All-In'})` : '';

        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🪙 Coinflip Game')
            .setDescription(`**Bet Amount:** ${betAmount.toLocaleString()} ${config.economy.currency}${betTypeText}\n**Your Choice:** ${userChoice.charAt(0).toUpperCase() + userChoice.slice(1)}\n\n${frames[0]} **Flipping coin...**`)
            .setFooter({ 
                text: `${message.author.username} is gambling`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        message.reply({ embeds: [embed] }).then(async (sentMessage) => {
            // Animate the spinning coin
            for (let i = 0; i < 6; i++) {
                await new Promise(resolve => setTimeout(resolve, 150));
                frameIndex = (frameIndex + 1) % frames.length;

                const animationEmbed = new EmbedBuilder()
                    .setColor(colors.primary)
                    .setTitle('🪙 Coinflip Game')
                    .setDescription(`**Bet Amount:** ${betAmount.toLocaleString()} ${config.economy.currency}${betTypeText}\n**Your Choice:** ${userChoice.charAt(0).toUpperCase() + userChoice.slice(1)}\n\n${frames[frameIndex]} **Flipping coin...**`)
                    .setFooter({ 
                        text: `${message.author.username} is gambling`,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();

                try {
                    await sentMessage.edit({ embeds: [animationEmbed] });
                } catch (error) {
                    // Message might be deleted, stop animation
                    return;
                }
            }

            // Determine result
            const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
            const won = coinResult === userChoice;
            const resultEmoji = coinResult === 'heads' ? '🟡' : '⚪';

            let finalEmbed;

            if (won) {
                // User won - double their money
                const winAmount = betAmount * 2;
                const newBalance = database.addBalance(message.author.id, winAmount);
                database.updateStats(message.author.id, 'won', betAmount);

                // Add experience for winning
                const expGain = database.addExperience(message.author.id, 20);

                finalEmbed = new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('🎉 You Won!')
                    .setDescription(`${resultEmoji} The coin landed on **${coinResult}**!\nYou guessed correctly!`)
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
                            name: '⭐ XP Gained',
                            value: '+20 XP',
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
            } else {
                // User lost
                const currentUserData = database.getUser(message.author.id);
                database.updateStats(message.author.id, 'lost', betAmount);

                finalEmbed = new EmbedBuilder()
                    .setColor(colors.error)
                    .setTitle('💸 You Lost!')
                    .setDescription(`${resultEmoji} The coin landed on **${coinResult}**.\nBetter luck next time!`)
                    .addFields(
                        {
                            name: '💸 Lost',
                            value: `-${betAmount.toLocaleString()} ${config.economy.currency}`,
                            inline: true
                        },
                        {
                            name: '💳 Remaining Balance',
                            value: `${currentUserData.balance.toLocaleString()} ${config.economy.currency}`,
                            inline: true
                        },
                        {
                            name: '🎯 Win Rate',
                            value: '50% chance',
                            inline: true
                        }
                    );
            }

            finalEmbed.setFooter({ 
                text: `Game completed | Your choice: ${userChoice}${isAllBet ? ' | All-in bet' : ''}`,
                iconURL: message.author.displayAvatarURL()
            }).setTimestamp();

            // Update command usage statistics
            database.updateStats(message.author.id, 'command');

            try {
                await sentMessage.edit({ embeds: [finalEmbed] });
            } catch (error) {
                // Message might be deleted
                message.channel.send({ embeds: [finalEmbed] });
            }
        }).catch(error => {
            console.error('Error in coinflip animation:', error); 
        });
    }
};