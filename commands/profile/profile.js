const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'profile',
    aliases: ['p', 'stats', 'me'],
    description: 'View your or another user\'s profile',
    usage: 'profile [@user]',
    execute(message, args, client) {
        let target = message.author;

        if (message.mentions.users.size > 0) {
            target = message.mentions.users.first();
        } else if (args.length > 0) {
            const userId = args[0];
            const foundUser = client.users.cache.get(userId);
            if (foundUser) target = foundUser;
        }

        const userData = database.getUser(target.id);
        const animalsData = database.loadAnimals();

        // Calculate essential stats
        const accountAge = Math.floor((Date.now() - userData.joinedAt) / (1000 * 60 * 60 * 24));
        const expToNextLevel = (userData.level * 100) - userData.experience;

        // Calculate animal collection
        let totalAnimalValue = 0;
        let totalAnimalsOwned = 0;
        let rarityCount = {};

        for (const rarity of Object.keys(config.hunting.rarities)) {
            rarityCount[rarity] = 0;
        }

        if (userData.animals) {
            for (const [rarity, animals] of Object.entries(userData.animals)) {
                if (animalsData[rarity]) {
                    for (const [animalKey, count] of Object.entries(animals)) {
                        if (animalsData[rarity][animalKey]) {
                            totalAnimalValue += animalsData[rarity][animalKey].value * count;
                            totalAnimalsOwned += count;
                            rarityCount[rarity] += count;
                        }
                    }
                }
            }
        }

        // Calculate gambling stats
        const totalGambled = userData.totalGambled || 0;
        const netProfit = (userData.totalWon || 0) - (userData.totalLost || 0);
        const winRate = totalGambled > 0 ? ((userData.totalWon / totalGambled) * 100).toFixed(1) : '0.0';

        // Create compact embed
        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`${target.username}'s Profile`)
            .setThumbnail(target.displayAvatarURL({ size: 256 }))
            .addFields(
                {
                    name: '📊 Stats',
                    value: [
                        `**Level:** ${userData.level}`,
                        `**XP:** ${userData.experience}/${userData.level * 100}`,
                        `**Balance:** ${userData.balance.toLocaleString()} ${config.economy.currency}`,
                        `**Animals:** ${totalAnimalsOwned} (${totalAnimalValue.toLocaleString()} ${config.economy.currency})`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎯 Activity',
                    value: [
                        `**Gambled:** ${totalGambled.toLocaleString()}`,
                        `**Net:** ${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}`,
                        `**Win Rate:** ${winRate}%`,
                        `**Account Age:** ${accountAge}d`
                    ].join('\n'),
                    inline: true
                }
            );

        // Add rarest animal if available
        const rarest = getRarestAnimal(rarityCount);
        if (rarest !== 'None') {
            embed.addFields({
                name: '🌟 Rarest',
                value: rarest,
                inline: true
            });
        }

        message.reply({ embeds: [embed] });

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');
    }
};

function getRarestAnimal(rarityCount) {
    const rarityOrder = ['priceless', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
    for (const rarity of rarityOrder) {
        if (rarityCount[rarity] > 0) {
            return config.hunting.rarities[rarity].name;
        }
    }
    return 'None';
}