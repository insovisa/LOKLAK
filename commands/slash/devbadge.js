const { SlashCommandBuilder } = require('discord.js');
const { isAdmin } = require('../../utils/adminCheck'); // FIXED PATH: changed from ../ to ../../

module.exports = {
    data: new SlashCommandBuilder()
        .setName('devbadge')
        .setDescription('[Admin] Ping Discord to keep the Active Developer Badge active')
        .setDefaultMemberPermissions('0'), // Blocks everyone by default
    
    // For command handler compatibility
    name: 'devbadge',

    async execute(interaction) {
        // Admin check - FIRST THING in execute()
        if (!isAdmin(interaction.user.id)) {
            return interaction.reply({
                content: '⛔ This command is restricted to bot administrators.',
                ephemeral: true
            });
        }

        // Your existing logic
        await interaction.reply({
            content: '✅ Slash command executed! You’ve pinged Discord for the Active Developer Badge renewal.',
            ephemeral: true
        });
    }
};