
const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const { getEquippedItems, calculateEquippedBonuses } = require('./item.js');

module.exports = {
    name: 'player',
    aliases: ['stats', 'pstats', 'playerstats'],
    description: 'View detailed player combat statistics',
    usage: 'player [@user]',
    cooldown: 5000, // 5 seconds
    async execute(message, args, client) {
        // Get target user (mentioned user or command author)
        let target = message.author;
        if (message.mentions.users.size > 0) {
            target = message.mentions.users.first();
        } else if (args[0]) {
            const userId = args[0];
            target = client.users.cache.get(userId);
        }

        if (!target) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ User Not Found',
                    description: 'Please mention a valid user or provide their ID.',
                    timestamp: new Date()
                }]
            });
        }

        const userData = database.getUser(target.id);
        const equipped = getEquippedItems(target.id);
        const bonuses = calculateEquippedBonuses(target.id);

        // Calculate base stats
        const baseStats = {
            attack: Math.floor(userData.level * 10 + userData.experience / 100),
            defense: Math.floor(userData.level * 8 + userData.experience / 150),
            health: Math.floor(userData.level * 15 + 100),
            luck: Math.floor(userData.level * 2)
        };

        // Calculate total stats (base + equipped bonuses)
        const totalStats = {
            attack: baseStats.attack + bonuses.attack,
            defense: baseStats.defense + bonuses.defense,
            health: baseStats.health + bonuses.hp,
            luck: baseStats.luck + bonuses.luck
        };

        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`⚔️ ${target.username}'s Combat Stats`)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                {
                    name: '📊 Base Stats',
                    value: [
                        `**Level:** ${userData.level}`,
                        `**Experience:** ${userData.experience.toLocaleString()}`,
                        `**Attack:** ${baseStats.attack}`,
                        `**Defense:** ${baseStats.defense}`,
                        `**Health:** ${baseStats.health}`,
                        `**Luck:** ${baseStats.luck}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚔️ Total Stats (With Equipment)',
                    value: [
                        `**Attack:** ${totalStats.attack} ${bonuses.attack > 0 ? `(+${bonuses.attack})` : ''}`,
                        `**Defense:** ${totalStats.defense} ${bonuses.defense > 0 ? `(+${bonuses.defense})` : ''}`,
                        `**Health:** ${totalStats.health} ${bonuses.hp > 0 ? `(+${bonuses.hp})` : ''}`,
                        `**Luck:** ${totalStats.luck} ${bonuses.luck > 0 ? `(+${bonuses.luck})` : ''}`,
                        bonuses.speed > 0 ? `**Speed:** +${bonuses.speed}` : '',
                        bonuses.critRate > 0 ? `**Crit Rate:** +${bonuses.critRate}` : '',
                        bonuses.evasion > 0 ? `**Evasion:** +${bonuses.evasion}` : ''
                    ].filter(Boolean).join('\n'),
                    inline: true
                }
            );

        // Show equipped items
        const equippedText = Object.keys(equipped).length > 0 
            ? Object.entries(equipped).map(([slot, item]) => {
                const bonusText = Object.entries(item.bonus)
                    .map(([stat, val]) => `+${val} ${stat}`)
                    .join(', ');
                return `**${slot.charAt(0).toUpperCase() + slot.slice(1)}:** ${item.name}\n   🔹 ${bonusText}`;
            }).join('\n')
            : 'No items equipped';

        embed.addFields({
            name: '🛡️ Equipped Items',
            value: equippedText,
            inline: false
        });

        // Battle statistics
        embed.addFields({
            name: '🏆 Battle Record',
            value: [
                `**Total Gambled:** ${userData.totalGambled?.toLocaleString() || 0}`,
                `**Total Won:** ${userData.totalWon?.toLocaleString() || 0}`,
                `**Total Lost:** ${userData.totalLost?.toLocaleString() || 0}`,
                `**Win Rate:** ${userData.totalGambled > 0 ? Math.round((userData.totalWon / userData.totalGambled) * 100) : 0}%`
            ].join('\n'),
            inline: false
        });

        embed.setFooter({
            text: `Use Kinv to manage equipment | Combat Power: ${totalStats.attack + totalStats.defense + totalStats.health + totalStats.luck}`,
            iconURL: target.displayAvatarURL()
        }).setTimestamp();

        await message.reply({ embeds: [embed] });

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');
    }
};
