const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'slots',
    aliases: ['s', 'slot', 'slotmachine'],
    description: 'Play the slot machine with tiered rewards',
    usage: 'slots <amount>',
    cooldown: 5000,
    async execute(message, args, client) {
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: 'Please provide a bet amount!\n**Usage:** `Kslots <amount>`\n**Example:** `Ks 1000`',
                    timestamp: new Date()
                }]
            });
        }

        const { minBet, maxBet } = config.gambling.slots;

        let betAmount;
        if (args[0].toLowerCase() === 'all') {
            betAmount = maxBet;
        } else {
            betAmount = parseInt(args[0]);
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
        }

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

        database.removeBalance(message.author.id, betAmount);
        database.updateStats(message.author.id, 'gambled', betAmount);

        const outcomes = [
            { type: 'diamond', weight: 5, emoji: '🔷', multiplier: 10, name: 'DIAMOND JACKPOT!' },
            { type: 'rocket', weight: 15, emoji: '🚀', multiplier: 5, name: 'ROCKET BONUS!' },
            { type: 'coin', weight: 25, emoji: '🪙', multiplier: 2, name: 'COIN WIN!' },
            { type: 'draw', weight: 30, emoji: '🤝', multiplier: 1, name: 'DRAW!' },
            { type: 'lose', weight: 25, emoji: '💀', multiplier: 0, name: 'LOSS' }
        ];

        let outcomePool = [];
        for (const outcome of outcomes) {
            for (let i = 0; i < outcome.weight; i++) {
                outcomePool.push(outcome);
            }
        }

        const selectedOutcome = outcomePool[Math.floor(Math.random() * outcomePool.length)];

        let displaySymbols;
        if (selectedOutcome.type === 'lose') {
            const allEmojis = outcomes.map(o => o.emoji);
            const shuffled = [...allEmojis].sort(() => Math.random() - 0.5);
            displaySymbols = {
                first: shuffled[0],
                middle: shuffled[1],
                last: shuffled[2]
            };
        } else {
            displaySymbols = {
                first: selectedOutcome.emoji,
                middle: selectedOutcome.emoji,
                last: selectedOutcome.emoji
            };
        }

        const slotEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🎰 Slot Machine')
            .setDescription(`**Bet:** ${betAmount.toLocaleString()} ${config.economy.currency}\n\n🎰 ┃ 🎯 ┃ 🎲 ┃\n**Spinning...**`)
            .setTimestamp();

        const sentMessage = await message.reply({ embeds: [slotEmbed] });

        async function updateSlotDisplay(stage) {
            let animationSymbols = { ...displaySymbols };
            let statusText = '';

            if (stage < 2) {
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.first = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.last = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**Spinning fast...**';
            } else if (stage < 4) {
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.first = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.last = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**Spinning...**';
            } else if (stage < 6) {
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                animationSymbols.last = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**Slowing down...**';
            } else if (stage < 7) {
                const randomEmojis = outcomes.map(o => o.emoji);
                animationSymbols.middle = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                statusText = '**Final spin...**';
            } else {
                statusText = '**Result!**';
            }

            slotEmbed.setDescription(
                `**Bet:** ${betAmount.toLocaleString()} ${config.economy.currency}\n\n` +
                `🎰 ┃ ${animationSymbols.first} ┃ ${animationSymbols.middle} ┃ ${animationSymbols.last} ┃\n` +
                statusText
            );

            try {
                await sentMessage.edit({ embeds: [slotEmbed] });
            } catch (error) {
                console.error('Failed to update slot animation:', error);
            }
        }

        for (let stage = 0; stage <= 7; stage++) {
            await updateSlotDisplay(stage);
            await new Promise(resolve => setTimeout(resolve,
                stage < 2 ? 200 :
                stage < 4 ? 250 :
                stage < 6 ? 300 :
                400
            ));
        }

        if (selectedOutcome.type === 'diamond' || selectedOutcome.type === 'rocket' || selectedOutcome.type === 'coin') {
            const winAmount = betAmount * selectedOutcome.multiplier;
            const newBalance = database.addBalance(message.author.id, winAmount);
            database.updateStats(message.author.id, 'won', winAmount - betAmount);
            const expGain = database.addExperience(message.author.id, 25);

            slotEmbed
                .setColor(colors.success || 0x43B581)
                .setTitle(`🎉 ${selectedOutcome.name}`)
                .setDescription(
                    `**${selectedOutcome.name}**\n\n` +
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**Winnings:** +${winAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**Balance:** ${newBalance.toLocaleString()} ${config.economy.currency}\n` +
                    `**Multiplier:** x${selectedOutcome.multiplier}`
                );

            if (expGain && expGain.leveledUp) {
                slotEmbed.addFields({
                    name: '🎉 Level Up!',
                    value: `Reached level **${expGain.newLevel}**!`,
                    inline: false
                });
            }
        } else if (selectedOutcome.type === 'draw') {
            const newBalance = database.addBalance(message.author.id, betAmount);

            slotEmbed
                .setColor(colors.secondary || 0x99AAB5)
                .setTitle('🤝 Draw!')
                .setDescription(
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**Bet returned!**\n\n` +
                    `**Amount returned:** ${betAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**Balance:** ${newBalance.toLocaleString()} ${config.economy.currency}`
                );
        } else {
            const userData = database.getUser(message.author.id);
            database.updateStats(message.author.id, 'lost', betAmount);

            slotEmbed
                .setColor(colors.error || 0xF04747)
                .setTitle('💀 You Lost')
                .setDescription(
                    `🎰 ┃ ${displaySymbols.first} ┃ ${displaySymbols.middle} ┃ ${displaySymbols.last} ┃\n\n` +
                    `**Amount lost:** ${betAmount.toLocaleString()} ${config.economy.currency}\n` +
                    `**Balance:** ${userData.balance.toLocaleString()} ${config.economy.currency}`
                );
        }

        await sentMessage.edit({ embeds: [slotEmbed] });
    }
};
