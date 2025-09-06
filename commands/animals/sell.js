
const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'sell',
    aliases: ['sellpet', 'sellanimals'],
    description: 'Sell animals from your collection',
    usage: 'sell <animal_name> or sell all',
    execute(message, args, client) {
        if (args.length === 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: 'Please specify what to sell!\n\n**Usage:**\n`Ksell <animal_name>` - Sell a specific animal\n`Ksell all` - Sell all animals',
                    timestamp: new Date()
                }]
            });
        }

        const userData = database.getUser(message.author.id);
        const animalsData = database.loadAnimals();
        const userAnimals = userData.animals || {};

        // Check if user has any animals
        let totalAnimals = 0;
        for (const rarity of Object.keys(userAnimals)) {
            for (const animal of Object.keys(userAnimals[rarity] || {})) {
                totalAnimals += userAnimals[rarity][animal];
            }
        }

        if (totalAnimals === 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ No Animals',
                    description: 'You don\'t have any animals to sell! Use `Khunt` to catch some animals first.',
                    timestamp: new Date()
                }]
            });
        }

        const sellAll = args[0].toLowerCase() === 'all';
        
        if (sellAll) {
            // Sell all animals
            let totalValue = 0;
            let animalsSold = 0;
            const soldAnimals = [];

            for (const [rarity, animals] of Object.entries(userAnimals)) {
                if (animalsData[rarity]) {
                    for (const [animalKey, count] of Object.entries(animals)) {
                        if (animalsData[rarity][animalKey] && count > 0) {
                            const animal = animalsData[rarity][animalKey];
                            const value = animal.value * count;
                            totalValue += value;
                            animalsSold += count;
                            soldAnimals.push(`${animal.emoji} **${animal.name}** x${count} - ${value.toLocaleString()} ${config.economy.currency}`);
                        }
                    }
                }
            }

            if (animalsSold === 0) {
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '❌ No Animals to Sell',
                        description: 'You don\'t have any valid animals to sell.',
                        timestamp: new Date()
                    }]
                });
            }

            // Clear all animals and add money
            userData.animals = {};
            userData.balance += totalValue;
            database.saveUser(userData);

            const embed = new EmbedBuilder()
                .setColor(colors.success)
                .setTitle('💰 Sold All Animals!')
                .setDescription(`You sold **${animalsSold}** animals for **${totalValue.toLocaleString()}** ${config.economy.currency}!`)
                .addFields({
                    name: '🏪 Animals Sold',
                    value: soldAnimals.slice(0, 10).join('\n') + (soldAnimals.length > 10 ? `\n*...and ${soldAnimals.length - 10} more*` : ''),
                    inline: false
                })
                .addFields({
                    name: '💳 New Balance',
                    value: `${userData.balance.toLocaleString()} ${config.economy.currency}`,
                    inline: true
                })
                .setFooter({ 
                    text: `Animals sold by ${message.author.username}`,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        } else {
            // Sell specific animal
            const animalName = args.join(' ').toLowerCase();
            let foundAnimal = null;
            let foundRarity = null;
            let foundKey = null;

            // Search for the animal in user's collection
            for (const [rarity, animals] of Object.entries(userAnimals)) {
                if (animalsData[rarity]) {
                    for (const [animalKey, count] of Object.entries(animals)) {
                        if (animalsData[rarity][animalKey] && count > 0) {
                            const animal = animalsData[rarity][animalKey];
                            if (animal.name.toLowerCase().includes(animalName) || animalKey.toLowerCase().includes(animalName)) {
                                foundAnimal = animal;
                                foundRarity = rarity;
                                foundKey = animalKey;
                                break;
                            }
                        }
                    }
                    if (foundAnimal) break;
                }
            }

            if (!foundAnimal) {
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '❌ Animal Not Found',
                        description: `You don't have an animal named "${args.join(' ')}" in your collection.\n\nUse \`Kzoo\` to see your animals.`,
                        timestamp: new Date()
                    }]
                });
            }

            // Sell one of the animal
            const currentCount = userAnimals[foundRarity][foundKey];
            const sellValue = foundAnimal.value;

            userAnimals[foundRarity][foundKey] -= 1;
            if (userAnimals[foundRarity][foundKey] <= 0) {
                delete userAnimals[foundRarity][foundKey];
                if (Object.keys(userAnimals[foundRarity]).length === 0) {
                    delete userAnimals[foundRarity];
                }
            }

            userData.balance += sellValue;
            database.saveUser(userData);

            const rarityInfo = config.hunting.rarities[foundRarity];
            const embed = new EmbedBuilder()
                .setColor(rarityInfo.color)
                .setTitle('💰 Animal Sold!')
                .setDescription(`You sold ${foundAnimal.emoji} **${foundAnimal.name}** for **${sellValue.toLocaleString()}** ${config.economy.currency}!`)
                .addFields({
                    name: '🏪 Sale Details',
                    value: `**Animal:** ${foundAnimal.emoji} ${foundAnimal.name}\n**Rarity:** ${rarityInfo.name}\n**Price:** ${sellValue.toLocaleString()} ${config.economy.currency}\n**Remaining:** ${currentCount - 1}`,
                    inline: true
                })
                .addFields({
                    name: '💳 New Balance',
                    value: `${userData.balance.toLocaleString()} ${config.economy.currency}`,
                    inline: true
                })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');
    }
};
