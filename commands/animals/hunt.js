const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'hunt',
    aliases: ['hunting'],
    description: 'Hunt for animals with 10-second cooldown and 7 rarity tiers',
    usage: 'hunt',
    cooldown: 10000, // 10 seconds
    execute(message, args, client) {
        const userData = database.getUser(message.author.id);
        const animalsData = database.loadAnimals();
        
        // Check if user gets distracted (30% chance)
        if (Math.random() < config.hunting.distractionChance) {
            // Distraction scenarios
            const distractions = [
                { emoji: '📱', text: 'got distracted by your phone', type: 'phone' },
                { emoji: '🍕', text: 'got hungry and went to get pizza', type: 'food' },
                { emoji: '😴', text: 'fell asleep while waiting', type: 'sleep' },
                { emoji: '🌧️', text: 'got caught in the rain and ran for shelter', type: 'weather' },
                { emoji: '🎮', text: 'got distracted by a game notification', type: 'game' },
                { emoji: '📺', text: 'got distracted by a funny video', type: 'video' },
                { emoji: '🚗', text: 'had to help a friend with car trouble', type: 'friend' },
                { emoji: '☕', text: 'needed a coffee break', type: 'coffee' },
                { emoji: '📚', text: 'remembered you had homework to do', type: 'homework' },
                { emoji: '🐱', text: 'got distracted by a cute cat', type: 'cat' },
                { emoji: '🎵', text: 'stopped to listen to your favorite song', type: 'music' },
                { emoji: '💤', text: 'dozed off and missed all the animals', type: 'nap' }
            ];
            
            const distraction = distractions[Math.floor(Math.random() * distractions.length)];
            
            const embed = new EmbedBuilder()
                .setColor(colors.warning)
                .setTitle('😅 Hunting Distraction!')
                .setDescription(`${distraction.emoji} **You ${distraction.text}!**\n\nNo animals were found this time. Try hunting again!`)
                
                .setTimestamp();

            // Update command usage statistics
            database.updateStats(message.author.id, 'command');
            
            return message.reply({ embeds: [embed] });
        }

        // Determine rarity based on weights
        const rarities = config.hunting.rarities;
        let totalWeight = 0;
        for (const rarity of Object.values(rarities)) {
            totalWeight += rarity.weight;
        }

        const random = Math.random() * totalWeight;
        let currentWeight = 0;
        let selectedRarity = 'common';

        for (const [rarityKey, rarityData] of Object.entries(rarities)) {
            currentWeight += rarityData.weight;
            if (random <= currentWeight) {
                selectedRarity = rarityKey;
                break;
            }
        }

        // Get animals of the selected rarity
        const availableAnimals = animalsData[selectedRarity];
        if (!availableAnimals) {
            return message.reply('❌ No animals available for this rarity.');
        }

        // Select random animal from the rarity tier
        const animalKeys = Object.keys(availableAnimals);
        const selectedAnimalKey = animalKeys[Math.floor(Math.random() * animalKeys.length)];
        const selectedAnimal = availableAnimals[selectedAnimalKey];

        // Add animal to user's collection
        database.addAnimal(message.author.id, selectedAnimalKey, selectedRarity);

        // Calculate rewards
        const rarityData = rarities[selectedRarity];
        let coinReward = selectedAnimal.value;
        let expReward = Math.floor(rarityData.value / 20); // Experience based on rarity value

        // Apply money booster if active
        const moneyBooster = database.getActiveBooster(message.author.id, 'money');
        if (moneyBooster) {
            coinReward = Math.floor(coinReward * moneyBooster.multiplier);
        }

        // Add rewards
        const newBalance = database.addBalance(message.author.id, coinReward);
        const expGain = database.addExperience(message.author.id, expReward);

        // Chance for booster drop (rare)
        let boosterReward = null;
        if (selectedRarity === 'legendary' || selectedRarity === 'mythical' || selectedRarity === 'priceless') {
            if (Math.random() < 0.15) { // 15% chance for rare rarities
                const boosterType = Math.random() < 0.5 ? 'money' : 'exp';
                const duration = 60 * 60 * 1000; // 1 hour
                database.addBooster(message.author.id, boosterType, 2, duration);
                boosterReward = { type: boosterType, multiplier: 2 };
            }
        }

        const embed = new EmbedBuilder()
            .setColor(parseInt(rarityData.color.slice(1), 16))
            .setTitle('🏹 Hunting Success!')
            .setDescription(`You found a **${selectedAnimal.name}**!\n${selectedAnimal.emoji} *${rarityData.name}* rarity`)
            .addFields(
                {
                    name: '💰 Coin Reward',
                    value: `+${coinReward.toLocaleString()} ${config.economy.currency}`,
                    inline: true
                },
                {
                    name: '⭐ XP Reward',
                    value: `+${expReward} XP`,
                    inline: true
                },
                {
                    name: '💳 New Balance',
                    value: `${newBalance.toLocaleString()} ${config.economy.currency}`,
                    inline: true
                },
                {
                    name: '🎯 Rarity Info',
                    value: [
                        `**Rarity:** ${rarityData.name}`,
                        `**Base Value:** ${selectedAnimal.value.toLocaleString()} ${config.economy.currency}`,
                        `**Collection:** +1 ${selectedAnimal.name}`
                    ].join('\n'),
                    inline: false
                }
            );

        // Add booster reward if received
        if (boosterReward) {
            embed.addFields({
                name: '🎁 Bonus Reward!',
                value: `You found a **${boosterReward.type} booster x${boosterReward.multiplier}** (1 hour)!`,
                inline: false
            });
        }

        // Add level up notification if applicable
        if (expGain.leveledUp) {
            embed.addFields({
                name: '🎉 Level Up!',
                value: `Congratulations! You reached level **${expGain.newLevel}**!`,
                inline: false
            });
        }

        // Add some hunting tips based on rarity
        let tip = '💡 Keep hunting to find rarer animals!';
        if (selectedRarity === 'priceless') {
            tip = '🌟 **INCREDIBLE!** You found a priceless animal! This is extremely rare!';
        } else if (selectedRarity === 'mythical') {
            tip = '✨ **AMAZING!** Mythical animals are incredibly rare finds!';
        } else if (selectedRarity === 'legendary') {
            tip = '🔥 **WOW!** Legendary animals are very special!';
        }

        embed.setDescription(`You found a **${selectedAnimal.name}**!\n${selectedAnimal.emoji} *${rarityData.name}* rarity\n\n${tip}`)
            .setThumbnail('https://cdn.discordapp.com/emojis/hunt.png') // Placeholder
            .setFooter({ 
                text: `Total animals found: ${userData.totalAnimalsFound + 1} | Cooldown: 10 seconds`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');

        message.reply({ embeds: [embed] });
    }
};
