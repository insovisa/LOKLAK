const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config.js');
const colors = require('../../utils/colors.js');

module.exports = {
    name: 'help',
    aliases: ['hp', 'commands'],
    description: 'Shows all available commands or detailed info about a specific command',
    usage: 'help [command]',
    execute(message, args, client) {
        if (args.length === 0) {
            // Show all commands organized by category
            const embed = new EmbedBuilder()
                .setColor(colors.primary || 0x0099FF)
                .setTitle('🎮 KsaekVat Bot Commands')
                .setDescription(`Here are all available commands. Use \`Khelp [command]\` for detailed info.\n\n**Main Prefix:** \`K\` or \`k\`\n**Short Prefixes:** \`hp\` (help), \`cf\` (coinflip), \`s\` (slots), \`d\` (daily), \`w\` (weekly), \`h\` (heads), \`t\` (tails), \`hunt\` (hunt), \`zoo\` (zoo), \`pl\` (pussylick)`)
                .addFields(
                    {
                        name: '📁 General',
                        value: [
                            '`Khelp` - Shows all available commands',
                            '`Kinfo` - Show bot information and statistics',
                            '`Kping` - Shows bot latency and response time',
                            '`Kavatar` - Show a user\'s avatar'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '💰 Economy',
                        value: [
                            '`Kbalance` - Check your or another user\'s balance',
                            '`Kdaily` - Claim your daily reward',
                            '`Kweekly` - Claim your weekly reward',
                            '`Kwork` - Work to earn some coins',
                            '`Kpay` - Pay coins to another user'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🎰 Gambling',
                        value: [
                            '`Kcoinflip` - Flip a coin and gamble your coins',
                            '`Kslots` - Play the slot machine',
                            '`Kdice` - Roll dice and gamble your coins'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🦊 Animals',
                        value: [
                            '`Khunt` - Hunt for animals with cooldown',
                            '`Kzoo` - View your animal collection',
                            '`Ksell` - Sell animals from your collection'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '⚔️ Battle',
                        value: [
                            '`Kduel` - pboul ke vai kean 1 smer',
                            '`Kfight` - vai knea mouy sat',
                            '`Kinv` - View your item inventory',
                            '`Kplayer` - View detailed player stats'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '👤 Profile',
                        value: [
                            '`Kprofile` - View your or another user\'s profile'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🔨 Admin Only',
                        value: [
                            '`Ksetbal` - Set a user\'s balance',
                            '`Ksetlvl` - Set a user\'s level',
                            '`Kreset` - Reset a user\'s data completely',
                            '`Kgiveitem` - Give an item to a user',
                            '`Kgivepet` - Give a pet to a user',
                            '`Kban` - Ban a user from the server',
                            '`Kkick` - Kick a user from the server',
                            '`Kclear` - Clear messages from the channel'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '😄 Expressions (GIF)',
                        value: [
                            '`Kkiss` - Kiss someone',
                            '`Kpunch` - Punch someone',
                            '`Kkill` - Kill someone (playfully)',
                            '`Kslap` - Slap someone',
                            '`Kjail` - Send someone to jail',
                            '`Kpat` - Pat someone',
                            '`Kbite` - Bite someone',
                            '`Ksad` - Express your sadness',
                            '`Kangry` - Express your anger',
                            '`Kpoke` - Poke someone (anime style)'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🔞NSFW',
                        value: [
                            '`Kfuck` - freaky with shawty',
                            '`Kbj` - nham jek',
                            '`Kpl` - nham oyster'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🎭 Special Expressions',
                        value: [
                            '`Kamongtwerk` - Among Us nheak kdit ',
                            '`Kksaekvat` - ah na chlery ksaekvat lerng klun '
                        ].join('\n'),
                        inline: true
                    }
                )
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // Show detailed info about a specific command
        const commandName = args[0].toLowerCase();
        const command = client.commands.get(commandName);

        if (!command) {
            return message.reply({
                embeds: [{
                    color: colors.error || 0xFF0000,
                    title: '❌ Command Not Found',
                    description: `Command \`${commandName}\` not found. Use \`Khelp\` to see all available commands.`,
                    timestamp: new Date()
                }]
            });
        }

        const embed = new EmbedBuilder()
            .setColor(colors.primary || 0x0099FF)
            .setTitle(`📖 Command: ${command.name}`)
            .setDescription(command.description || 'No description available');

        if (command.aliases && command.aliases.length > 0) {
            embed.addFields({ name: 'Aliases', value: command.aliases.join(', '), inline: true });
        }

        if (command.usage) {
            embed.addFields({ name: 'Usage', value: `\`K${command.usage}\``, inline: true });
        }

        if (command.cooldown) {
            embed.addFields({ name: 'Cooldown', value: `${command.cooldown / 1000} seconds`, inline: true });
        }

        if (command.adminOnly) {
            embed.addFields({ name: 'Restrictions', value: 'Admin Only', inline: true });
        }

        embed.setTimestamp();

        message.reply({ embeds: [embed] });
    }
};