const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'zoo',
    aliases: ['collection', 'animals'],
    description: 'View your animal collection with their rarity and values',
    usage: 'zoo [@user]',
    execute(message, args, client) {
        let target = message.author;
        
        // Check if user mentioned someone or provided a user ID
        if (message.mentions.users.size > 0) {
            target = message.mentions.users.first();
        } else if (args.length > 0) {
            const userId = args[0];
            const foundUser = client.users.cache.get(userId);
            if (foundUser) target = foundUser;
        }

        const userData = database.getUser(target.id);
        const animalsData = database.loadAnimals();
        const userAnimals = userData.animals || {};
        
        // Calculate total animals and value
        let totalAnimals = 0;
        let totalValue = 0;
        let rarityStats = {};
        
        // Initialize rarity stats
        for (const rarity of Object.keys(config.hunting.rarities)) {
            rarityStats[rarity] = { count: 0, value: 0 };
        }
        
        // Count animals by rarity
        for (const [rarity, animals] of Object.entries(userAnimals)) {
            if (animalsData[rarity]) {
                for (const [animalKey, count] of Object.entries(animals)) {
                    if (animalsData[rarity][animalKey]) {
                        const animalValue = animalsData[rarity][animalKey].value * count;
                        totalAnimals += count;
                        totalValue += animalValue;
                        rarityStats[rarity].count += count;
                        rarityStats[rarity].value += animalValue;
                    }
                }
            }
        }

        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`🏛️ ${target.username}'s Zoo`)
            .setThumbnail(target.displayAvatarURL())
            .setDescription(`**Total Animals:** ${totalAnimals}\n**Collection Value:** ${totalValue.toLocaleString()} ${config.economy.currency}`)
            .addFields(
                {
                    name: '📊 Collection Summary',
                    value: totalAnimals > 0 ? 
                        `**Animals Found:** ${userData.totalAnimalsFound}\n**Unique Species:** ${Object.keys(userAnimals).reduce((sum, rarity) => sum + Object.keys(userAnimals[rarity] || {}).length, 0)}\n**Average Value:** ${Math.floor(totalValue / totalAnimals).toLocaleString()} ${config.economy.currency}` :
                        'No animals found yet! Use `Khunt` to start collecting.',
                    inline: false
                }
            );

        // Add rarity breakdown
        if (totalAnimals > 0) {
            const rarityBreakdown = [];
            
            for (const [rarity, data] of Object.entries(rarityStats)) {
                if (data.count > 0) {
                    const rarityInfo = config.hunting.rarities[rarity];
                    const percentage = ((data.count / totalAnimals) * 100).toFixed(1);
                    rarityBreakdown.push(
                        `**${rarityInfo.name}:** ${data.count} (${percentage}%) - ${data.value.toLocaleString()} ${config.economy.currency}`
                    );
                }
            }
            
            if (rarityBreakdown.length > 0) {
                embed.addFields({
                    name: '🌟 Rarity Breakdown',
                    value: rarityBreakdown.join('\n'),
                    inline: false
                });
            }

            // Show detailed animals (up to 3 rarest rarities)
            const sortedRarities = Object.entries(rarityStats)
                .filter(([_, data]) => data.count > 0)
                .sort((a, b) => config.hunting.rarities[a[0]].weight - config.hunting.rarities[b[0]].weight)
                .slice(0, 3);

            for (const [rarity, _] of sortedRarities) {
                if (userAnimals[rarity]) {
                    const rarityInfo = config.hunting.rarities[rarity];
                    const animalList = [];
                    
                    for (const [animalKey, count] of Object.entries(userAnimals[rarity])) {
                        if (animalsData[rarity] && animalsData[rarity][animalKey]) {
                            const animal = animalsData[rarity][animalKey];
                            animalList.push(`${animal.emoji} **${animal.name}** x${count}`);
                        }
                    }
                    
                    if (animalList.length > 0) {
                        // Limit to 10 animals per rarity to avoid embed length issues
                        const displayList = animalList.slice(0, 10);
                        if (animalList.length > 10) {
                            displayList.push(`*...and ${animalList.length - 10} more*`);
                        }
                        
                        embed.addFields({
                            name: `${rarityInfo.name} Animals`,
                            value: displayList.join('\n'),
                            inline: true
                        });
                    }
                }
            }
        }

        // Add achievement-like information
        const achievements = [];
        if (userData.totalAnimalsFound >= 100) achievements.push('🏆 Animal Hunter (100+ finds)');
        if (userData.totalAnimalsFound >= 500) achievements.push('🥇 Animal Master (500+ finds)');
        if (totalValue >= 100000) achievements.push('💰 Wealthy Collector (100k+ value)');
        if (Object.keys(userAnimals).length >= 5) achievements.push('🌈 Rarity Collector (5+ rarities)');
        
        // Check for rare animals
        if (userAnimals.priceless && Object.keys(userAnimals.priceless).length > 0) {
            achievements.push('⭐ Priceless Collector');
        }
        if (userAnimals.mythical && Object.keys(userAnimals.mythical).length > 0) {
            achievements.push('✨ Mythical Hunter');
        }

        if (achievements.length > 0) {
            embed.addFields({
                name: '🏅 Achievements',
                value: achievements.join('\n'),
                inline: false
            });
        }

        embed.setTimestamp();

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');

        message.reply({ embeds: [embed] });
    }
};
