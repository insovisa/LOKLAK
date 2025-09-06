const { SlashCommandBuilder } = require('discord.js');
const { isAdmin } = require('../../utils/adminCheck');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cleardm')
        .setDescription('[Admin] Clear messages in this DM')
        .setDMPermission(true) // Explicitly enable for DMs
        .setDefaultMemberPermissions('0'), // Admin-only
    
    async execute(interaction) {
        // Double-check environment
        if (!interaction.inGuild() && !interaction.inCachedGuild() && interaction.channel?.type === 'DM') {
            if (!isAdmin(interaction.user.id)) {
                return interaction.reply({
                    content: '⛔ This command is restricted to bot administrators.',
                    ephemeral: true
                });
            }
            
            // Rest of your DM-only command logic
            await interaction.reply('Clearing DMs...');
        } else {
            await interaction.reply({
                content: '❌ This command only works in DMs with the bot.',
                ephemeral: true
            });
        }
    }
};