const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'daily',
    aliases: ['d'],
    description: 'Claim your daily reward',
    usage: 'daily',
    execute(message, args, client) {
        const userData = database.getUser(message.author.id);
        
        // Check if user has already claimed daily reward
        const now = new Date();
        const lastDaily = userData.lastDaily ? new Date(userData.lastDaily) : null;
        
        // Check if it's been 24 hours since last claim
        if (lastDaily && now - lastDaily < 24 * 60 * 60 * 1000) {
            const timeLeft = 24 * 60 * 60 * 1000 - (now - lastDaily);
            const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '⏰ Daily Already Claimed',
                    description: `You've already claimed your daily reward! Come back in **${hoursLeft}h ${minutesLeft}m**.`,
                    thumbnail: { url: message.author.displayAvatarURL() },
                    timestamp: new Date()
                }]
            });
        }

        // Generate random reward amount
        const { min, max } = config.economy.dailyReward;
        const baseReward = Math.floor(Math.random() * (max - min + 1)) + min;
        
        // Apply money booster if active
        let finalReward = baseReward;
        const moneyBooster = database.getActiveBooster(message.author.id, 'money');
        if (moneyBooster) {
            finalReward = Math.floor(baseReward * moneyBooster.multiplier);
        }

        // Add bonus based on level (small bonus)
        const levelBonus = Math.floor(userData.level * 10);
        finalReward += levelBonus;

        // Update user data
        userData.balance += finalReward;
        userData.lastDaily = now.toISOString();
        userData.dailyClaimed = true;
        database.saveUser(userData);

        // Add some experience
        database.addExperience(message.author.id, 25);

        const embed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('🎁 Daily Reward Claimed!')
            .setThumbnail('https://cdn.discordapp.com/emojis/123456789.gif') // Placeholder for gift animation
            .addFields(
                {
                    name: `${config.economy.currencySymbol} Reward`,
                    value: `**+${finalReward.toLocaleString()}** ${config.economy.currency}`,
                    inline: true
                },
                {
                    name: '💰 New Balance',
                    value: `**${userData.balance.toLocaleString()}** ${config.economy.currency}`,
                    inline: true
                },
                {
                    name: '⭐ Bonus XP',
                    value: '+25 XP',
                    inline: true
                }
            );

        // Show breakdown if there are bonuses
        let breakdownText = [`Base: ${baseReward.toLocaleString()} ${config.economy.currency}`];
        
        if (levelBonus > 0) {
            breakdownText.push(`Level Bonus: +${levelBonus.toLocaleString()} ${config.economy.currency}`);
        }
        
        if (moneyBooster) {
            breakdownText.push(`Money Booster (x${moneyBooster.multiplier}): Applied`);
        }

        embed.addFields({
            name: '📊 Breakdown',
            value: breakdownText.join('\n'),
            inline: false
        });

        embed.setDescription('💡 **Tip:** Come back tomorrow for another daily reward!')
            .setFooter({ 
                text: `Daily streak: Check back in 24 hours!`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');

        message.reply({ embeds: [embed] });
    }
};
