const config = require('../config/config.js');
const logger = require('../utils/logger.js');
const cooldowns = require('../utils/cooldowns.js');
const database = require('../utils/database.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// File paths for persistent storage
const LISTENERS_FILE = path.join(__dirname, '../data/listeners.json');
const TALK_TARGETS_FILE = path.join(__dirname, '../data/talktargets.json');

function loadListeners() {
    try {
        if (!fs.existsSync(LISTENERS_FILE)) return {};
        return JSON.parse(fs.readFileSync(LISTENERS_FILE, 'utf8'));
    } catch (error) {
        return {};
    }
}

function loadTalkTargets() {
    try {
        if (!fs.existsSync(TALK_TARGETS_FILE)) return {};
        return JSON.parse(fs.readFileSync(TALK_TARGETS_FILE, 'utf8'));
    } catch (error) {
        return {};
    }
}

module.exports = {
    name: 'messageCreate',
    execute(message, client) {
        // Ignore messages from bots
        if (message.author.bot) return;

        // === LISTEN FUNCTIONALITY ===
        handleMessageListening(message, client);

        // === DM FORWARDING FUNCTIONALITY ===
        if (message.channel.type === 1) { // DM Channel
            handleDMForwarding(message, client);
            return; // Don't process DMs as regular commands
        }

        // === REGULAR COMMAND PROCESSING ===
        // Check if message starts with any valid prefix
        let prefix = null;
        let commandName = null;
        let args = [];

        // Check main prefixes (K, k)
        for (const p of config.prefix) {
            if (message.content.startsWith(p)) {
                prefix = p;
                args = message.content.slice(prefix.length).trim().split(/ +/);
                commandName = args.shift().toLowerCase();
                break;
            }
        }

        // Check short prefixes if no main prefix found
        if (!prefix) {
            for (const [shortPrefix, fullCommand] of Object.entries(config.shortPrefixes)) {
                if (message.content.startsWith(shortPrefix + ' ') || message.content === shortPrefix) {
                    prefix = shortPrefix;
                    // Handle special cases for head/tail
                    if (fullCommand.includes(' ')) {
                        const commandParts = fullCommand.split(' ');
                        commandName = commandParts[0];
                        args = [commandParts[1], ...message.content.slice(shortPrefix.length).trim().split(/ +/)];
                        if (args[args.length - 1] === '') args.pop(); // Remove empty last element
                    } else {
                        commandName = fullCommand;
                        args = message.content.slice(shortPrefix.length).trim().split(/ +/);
                        if (args[0] === '') args.shift(); // Remove empty first element
                    }
                    break;
                }
            }
        }

        // If no valid prefix found, return
        if (!prefix || !commandName) return;

        // Handle "all" betting prefix
        if (args.length > 0 && args[0].toLowerCase() === 'all') {
            const user = database.getUser(message.author.id);
            args[0] = Math.min(user.balance, 250000).toString(); // Bet everything up to the max
        }

        // Get the command
        const command = client.commands.get(commandName);
        if (!command) return;

        // Check if user is admin for admin-only commands
        if (command.adminOnly && !config.adminIds.includes(message.author.id)) {
            return message.reply({
                embeds: [{
                    color: parseInt(config.colors.error.slice(1), 16),
                    title: '❌ Access Denied',
                    description: 'This command is only available to administrators.',
                    timestamp: new Date()
                }]
            });
        }

        // Check cooldowns
        if (command.cooldown) {
            const cooldownKey = `${message.author.id}-${commandName}`;
            if (cooldowns.isOnCooldown(cooldownKey, command.cooldown)) {
                const timeLeft = cooldowns.getTimeLeft(cooldownKey, command.cooldown);
                return message.reply({
                    embeds: [{
                        color: parseInt(config.colors.warning.slice(1), 16),
                        title: '⏰ Cooldown Active',
                        description: `Please wait ${Math.ceil(timeLeft / 1000)} more seconds before using this command again.`,
                        timestamp: new Date()
                    }]
                });
            }
            cooldowns.setCooldown(cooldownKey);
        }

        // Execute the command
        try {
            command.execute(message, args, client);
            logger.info(`${message.author.tag} used command: ${commandName} in ${message.guild ? message.guild.name : 'DM'}`);
        } catch (error) {
            logger.error(`Error executing command ${commandName}:`, error);
            message.reply({
                embeds: [{
                    color: parseInt(config.colors.error.slice(1), 16),
                    title: '❌ Command Error',
                    description: 'There was an error executing this command. Please try again later.',
                    timestamp: new Date()
                }]
            });
        }
    }
};

// Handle message listening functionality
async function handleMessageListening(message, client) {
    const listeners = loadListeners();
    
    // Check if any admin is listening to this user
    for (const [adminId, targetUserId] of Object.entries(listeners)) {
        if (message.author.id === targetUserId) {
            try {
                const admin = await client.users.fetch(adminId);
                
                const serverName = message.guild ? message.guild.name : 'Direct Message';
                const channelName = message.channel.name || 'DM';
                
                const embed = new EmbedBuilder()
                    .setTitle('👀 Message Intercepted')
                    .setColor(0x3498db)
                    .addFields([
                        { name: '👤 User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                        { name: '🏠 Server', value: serverName, inline: true },
                        { name: '📍 Channel', value: `#${channelName}`, inline: true },
                        { name: '💬 Message', value: message.content || '*[No text content]*', inline: false }
                    ])
                    .setTimestamp()
                    .setThumbnail(message.author.displayAvatarURL());
                
                // Include attachments if any
                if (message.attachments.size > 0) {
                    const attachments = message.attachments.map(att => att.url).join('\n');
                    embed.addFields([
                        { name: '📎 Attachments', value: attachments, inline: false }
                    ]);
                }
                
                await admin.send({ embeds: [embed] });
                
            } catch (error) {
                console.error(`Failed to send listen notification to admin ${adminId}:`, error);
            }
        }
    }
}

// Handle DM forwarding functionality
async function handleDMForwarding(message, client) {
    const adminIDs = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];
    
    // Only process DMs from admins
    if (!adminIDs.includes(message.author.id)) return;
    
    const talkTargets = loadTalkTargets();
    const adminTarget = talkTargets[message.author.id];
    
    if (!adminTarget) return;
    
    try {
        const guild = await client.guilds.fetch(adminTarget.serverId);
        const channel = await guild.channels.fetch(adminTarget.channelId);
        
        // Forward the message content
        if (message.content) {
            await channel.send(message.content);
        }
        
        // Forward attachments if any
        if (message.attachments.size > 0) {
            for (const attachment of message.attachments.values()) {
                await channel.send({ files: [attachment.url] });
            }
        }
        
    } catch (error) {
        console.error(`Failed to forward DM from admin ${message.author.id}:`, error);
        // Optionally notify the admin that forwarding failed
        try {
            await message.author.send('❌ Failed to forward your message. Please check if the target server/channel still exists and the bot has permissions.');
        } catch (dmError) {
            console.error('Failed to notify admin about forwarding failure:', dmError);
        }
    }
}