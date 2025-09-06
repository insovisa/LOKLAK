const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { isAdmin } = require('../../utils/adminCheck'); // Using centralized admin check

const LISTENERS_FILE = path.join(__dirname, '../../data/listeners.json');

// Initialize data directory and file
function initDataFiles() {
    const dataDir = path.dirname(LISTENERS_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(LISTENERS_FILE)) {
        fs.writeFileSync(LISTENERS_FILE, '{}', 'utf8');
    }
}

// Data handling functions
function loadListeners() {
    try {
        const data = fs.readFileSync(LISTENERS_FILE, 'utf8');
        return JSON.parse(data) || {};
    } catch (error) {
        console.error('Error loading listeners:', error);
        return {};
    }
}

function saveListeners(data) {
    try {
        fs.writeFileSync(LISTENERS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving listeners:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listen')
        .setDescription('[Admin] Start listening to messages from a specific user')
        .addStringOption(option =>
            option.setName('target_user_id')
                .setDescription('The user ID to monitor')
                .setRequired(true))
        .setDefaultMemberPermissions('0'), // No default permissions

    async execute(interaction) {
        // Initialize data files first
        initDataFiles();

        // Admin check - reject non-admins immediately
        if (!isAdmin(interaction.user.id)) {
            return interaction.reply({
                content: '⛔ This command is restricted to bot administrators.',
                ephemeral: true
            });
        }

        const targetUserId = interaction.options.getString('target_user_id').trim();
        
        // Validate user ID format
        if (!/^\d{17,20}$/.test(targetUserId)) {
            return interaction.reply({
                content: '❌ Invalid user ID format. Please provide a valid Discord user ID.',
                ephemeral: true
            });
        }

        try {
            // Verify the user exists
            const targetUser = await interaction.client.users.fetch(targetUserId);
            
            // Update listeners
            const listeners = loadListeners();
            listeners[interaction.user.id] = targetUserId;
            saveListeners(listeners);

            // Success response
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Listening Activated')
                .setDescription(`Now monitoring messages from **${targetUser.tag}**`)
                .addFields(
                    { name: 'User ID', value: targetUserId, inline: true },
                    { name: 'Notifications', value: 'You will receive DMs when this user sends messages', inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            
        } catch (error) {
            console.error('Listen command error:', error);
            
            let errorMessage;
            if (error.code === 10013) { // Unknown User
                errorMessage = `❌ User with ID ${targetUserId} not found.`;
            } else {
                errorMessage = '❌ An error occurred while setting up listener.';
            }

            await interaction.reply({
                content: errorMessage,
                ephemeral: true
            });
        }
    }
};