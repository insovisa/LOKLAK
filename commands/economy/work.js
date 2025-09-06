const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'work',
    aliases: ['job'],
    description: 'Work to earn some coins',
    usage: 'work',
    cooldown: 30000, // 30 seconds cooldown
    execute(message, args, client) {
        const userData = database.getUser(message.author.id);
        
        // Array of work scenarios
        const workScenarios = [
            { job: 'Pizza Delivery Driver', action: 'delivered pizzas', emoji: '🍕' },
            { job: 'Uber Driver', action: 'drove passengers around', emoji: '🚗' },
            { job: 'Dog Walker', action: 'walked cute dogs', emoji: '🐕' },
            { job: 'Freelance Developer', action: 'coded some websites', emoji: '💻' },
            { job: 'Barista', action: 'made delicious coffee', emoji: '☕' },
            { job: 'Tutor', action: 'taught students', emoji: '📚' },
            { job: 'Food Critic', action: 'reviewed restaurants', emoji: '🍽️' },
            { job: 'Street Performer', action: 'entertained people', emoji: '🎭' },
            { job: 'Content Creator', action: 'made viral videos', emoji: '📹' },
            { job: 'Gardener', action: 'tended to beautiful gardens', emoji: '🌱' },
            { job: 'Photographer', action: 'took stunning photos', emoji: '📸' },
            { job: 'Chef', action: 'cooked amazing meals', emoji: '👨‍🍳' },
            { job: 'Taxi Driver', action: 'gave rides to customers', emoji: '🚕' },
            { job: 'Cleaner', action: 'cleaned office buildings', emoji: '🧹' },
            { job: 'Translator', action: 'translated documents', emoji: '🌍' }
        ];

        // Select random work scenario
        const scenario = workScenarios[Math.floor(Math.random() * workScenarios.length)];
        
        // Generate random reward amount
        const { min, max } = config.economy.workReward;
        const baseReward = Math.floor(Math.random() * (max - min + 1)) + min;
        
        // Apply money booster if active
        let finalReward = baseReward;
        const moneyBooster = database.getActiveBooster(message.author.id, 'money');
        if (moneyBooster) {
            finalReward = Math.floor(baseReward * moneyBooster.multiplier);
        }

        // Small level bonus
        const levelBonus = Math.floor(userData.level * 2);
        finalReward += levelBonus;

        // Random chance for extra tip (10% chance)
        let tip = 0;
        if (Math.random() < 0.1) {
            tip = Math.floor(Math.random() * 200) + 50;
            finalReward += tip;
        }

        // Update user data
        const newBalance = database.addBalance(message.author.id, finalReward);
        
        // Add small experience
        const expGain = database.addExperience(message.author.id, 15);

        const embed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle(`${scenario.emoji} Work Complete!`)
            .setDescription(`You worked as a **${scenario.job}** and ${scenario.action}!`)
            .addFields(
                {
                    name: `${config.economy.currencySymbol} Earned`,
                    value: `**+${finalReward.toLocaleString()}** ${config.economy.currency}`,
                    inline: true
                },
                {
                    name: '💰 New Balance',
                    value: `**${newBalance.toLocaleString()}** ${config.economy.currency}`,
                    inline: true
                },
                {
                    name: '⭐ XP Gained',
                    value: '+15 XP',
                    inline: true
                }
            );

        // Show breakdown if there are bonuses
        let breakdownText = [`Base Pay: ${baseReward.toLocaleString()} ${config.economy.currency}`];
        
        if (levelBonus > 0) {
            breakdownText.push(`Experience Bonus: +${levelBonus.toLocaleString()} ${config.economy.currency}`);
        }
        
        if (tip > 0) {
            breakdownText.push(`Customer Tip: +${tip.toLocaleString()} ${config.economy.currency} 🎉`);
        }
        
        if (moneyBooster) {
            breakdownText.push(`Money Booster (x${moneyBooster.multiplier}): Applied`);
        }

        embed.addFields({
            name: '📊 Payment Breakdown',
            value: breakdownText.join('\n'),
            inline: false
        });

        // Add level up notification if applicable
        if (expGain.leveledUp) {
            embed.addFields({
                name: '🎉 Level Up!',
                value: `Congratulations! You reached level **${expGain.newLevel}**!`,
                inline: false
            });
        }

        embed.setFooter({ 
            text: `Cooldown: 30 seconds | ${scenario.job}`,
            iconURL: message.author.displayAvatarURL()
        }).setTimestamp();

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');

        message.reply({ embeds: [embed] });
    }
};
