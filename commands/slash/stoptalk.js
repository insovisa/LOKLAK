const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { isAdmin } = require('../../utils/adminCheck');

const TALK_TARGETS_FILE = path.join(__dirname, '../../data/talktargets.json');

// Data handling functions
function loadTalkTargets() {
    try {
        if (!fs.existsSync(TALK_TARGETS_FILE)) {
            fs.writeFileSync(TALK_TARGETS_FILE, '{}', 'utf8');
            return {};
        }
        const data = fs.readFileSync(TALK_TARGETS_FILE, 'utf8');
        return JSON.parse(data) || {};
    } catch (error) {
        console.error('Error loading talk targets:', error);
        return {};
    }
}

function saveTalkTargets(data) {
    try {
        const dataDir = path.dirname(TALK_TARGETS_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(TALK_TARGETS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving talk targets:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stoptalk')
        .setDescription('[Admin] Stop DM message forwarding')
        .setDefaultMemberPermissions('0'), // No default permissions

    async execute(interaction) {
        // Immediate admin check
        if (!isAdmin(interaction.user.id)) {
            return interaction.reply({
                content: '⛔ This command is restricted to bot administrators.',
                ephemeral: true
            });
        }

        try {
            const talkTargets = loadTalkTargets();
            
            if (talkTargets[interaction.user.id]) {
                const removedTargetId = talkTargets[interaction.user.id];
                delete talkTargets[interaction.user.id];
                saveTalkTargets(talkTargets);

                // Create success embed
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ DM Forwarding Stopped')
                    .setDescription('You will no longer receive forwarded DMs')
                    .addFields(
                        { name: 'Previous Target', value: `<@${removedTargetId}>`, inline: true },
                        { name: 'User ID', value: removedTargetId, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({
                    content: 'ℹ️ You did not have DM forwarding enabled.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Stoptalk command error:', error);
            
            const errorMessage = error.code === 'ENOENT' 
                ? '❌ No active forwarding configurations found'
                : '❌ An error occurred while stopping message forwarding';

            await interaction.reply({
                content: errorMessage,
                ephemeral: true
            });
        }
    }
};