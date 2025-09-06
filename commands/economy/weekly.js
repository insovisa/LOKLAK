const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'weekly',
    aliases: ['w'],
    description: 'Claim your weekly reward',
    usage: 'weekly',
    execute(message, args, client) {
        const userData = database.getUser(message.author.id);
        
        // Check if user has already claimed weekly reward
        const now = new Date();
        const lastWeekly = userData.lastWeekly ? new Date(userData.lastWeekly) : null;
        
        // Check if it's been 7 days since last claim
        if (lastWeekly && now - lastWeekly < 7 * 24 * 60 * 60 * 1000) {
            const timeLeft = 7 * 24 * 60 * 60 * 1000 - (now - lastWeekly);
            const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
            const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '⏰ Weekly Already Claimed',
                    description: `You've already claimed your weekly reward! Come back in **${daysLeft}d ${hoursLeft}h**.`,
                    thumbnail: { url: message.author.displayAvatarURL() },
                    timestamp: new Date()
                }]
            });
        }

        // Generate random reward amount (much higher than daily)
        const { min, max } = config.economy.weeklyReward;
        const baseReward = Math.floor(Math.random() * (max - min + 1)) + min;
        
        // Apply money booster if active
        let finalReward = baseReward;
        const moneyBooster = database.getActiveBooster(message.author.id, 'money');
        if (moneyBooster) {
            finalReward = Math.floor(baseReward * moneyBooster.multiplier);
        }

        // Add significant level bonus
        const levelBonus = Math.floor(userData.level * 50);
        finalReward += levelBonus;

        // Chance for bonus booster (5% chance)
        let bonusBooster = null;
        if (Math.random() < 0.05) {
            const boosterType = Math.random() < 0.5 ? 'money' : 'exp';
            const duration = 30 * 60 * 1000; // 30 minutes
            database.addBooster(message.author.id, boosterType, 2, duration);
            bonusBooster = { type: boosterType, multiplier: 2, duration: 30 };
        }

        // Update user data
        userData.balance += finalReward;
        userData.lastWeekly = now.toISOString();
        userData.weeklyClaimed = true;
        database.saveUser(userData);

        // Add substantial experience
        database.addExperience(message.author.id, 100);

        const embed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('🎊 Weekly Reward Claimed!')
            .setThumbnail('https://cdn.discordapp.com/emojis/123456789.gif') // Placeholder for celebration animation
            .addFields(
                {
                    name: `${config.economy.currencySymbol} Weekly Reward`,
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
                    value: '+100 XP',
                    inline: true
                }
            );

        // Show breakdown
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

        // Add bonus booster information if received
        if (bonusBooster) {
            embed.addFields({
                name: '🎉 Bonus Reward!',
                value: `You received a **${bonusBooster.type} booster x${bonusBooster.multiplier}** for ${bonusBooster.duration} minutes!`,
                inline: false
            });
        }

        embed.setDescription('🌟 **Weekly rewards are much more valuable than daily rewards!**')
            .setFooter({ 
                text: `Next weekly reward available in 7 days!`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');

        message.reply({ embeds: [embed] });
    }
};
