const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js'); // Added missing import

module.exports = {
    name: 'givepet',
    aliases: ['addpet', 'giveanimal'],
    description: 'Give a pet to a user (Admin only)',
    usage: 'givepet <@user> <rarity> <animal_name> [amount]',
    adminOnly: true,
    async execute(message, args, client) { // Made async for DM functionality
        // Check arguments
        if (args.length < 3) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: [
                        'Please provide a user, rarity, and animal name.',
                        '**Usage:** `Kgivepet @user <rarity> <animal_name> [amount]`',
                        '',
                        '**Available Rarities:**',
                        '• `common` • `uncommon` • `rare` • `epic`',
                        '• `legendary` • `mythical` • `priceless`',
                        '',
                        '**Examples:**',
                        '`Kgivepet @user common cat 5`',
                        '`Kgivepet @user legendary golden_dragon 1`',
                        '`Kgivepet @user priceless ancient_guardian`'
                    ].join('\n'),
                    timestamp: new Date()
                }]
            });
        }

        // Get target user
        let target = null;
        if (message.mentions.users.size > 0) {
            target = message.mentions.users.first();
        } else {
            const userId = args[0];
            target = client.users.cache.get(userId);
        }

        if (!target) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ User Not Found',
                    description: 'Please mention a valid user or provide their user ID.',
                    timestamp: new Date()
                }]
            });
        }

        // Can't give pets to bots
        if (target.bot) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Target',
                    description: 'You cannot give pets to bots!',
                    timestamp: new Date()
                }]
            });
        }

        const rarity = args[1].toLowerCase();
        const animalName = args[2].toLowerCase();
        const amount = args[3] ? parseInt(args[3]) : 1;

        // Validate amount
        if (isNaN(amount) || amount <= 0 || amount > 100) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Amount',
                    description: 'Amount must be a valid number between 1 and 100.',
                    timestamp: new Date()
                }]
            });
        }

        try {
            // Load animals data
            const animalsData = database.loadAnimals();

            // Validate rarity
            if (!animalsData[rarity]) {
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '❌ Invalid Rarity',
                        description: [
                            'Available rarities:',
                            Object.keys(animalsData).map(r => `• \`${r}\``).join('\n')
                        ].join('\n'),
                        timestamp: new Date()
                    }]
                });
            }

            // Validate animal
            if (!animalsData[rarity][animalName]) {
                const availableAnimals = Object.keys(animalsData[rarity]);
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '❌ Invalid Animal',
                        description: [
                            `Available ${rarity} animals:`,
                            availableAnimals.map(animal => `• \`${animal}\``).join('\n')
                        ].join('\n'),
                        timestamp: new Date()
                    }]
                });
            }

            const animal = animalsData[rarity][animalName];

            // Add animal to user's collection
            for (let i = 0; i < amount; i++) {
                database.addAnimal(target.id, animalName, rarity);
            }

            // Calculate total value
            const totalValue = animal.value * amount;

            // Get rarity color safely
            let rarityColor = colors.primary; // Default color
            if (config.hunting && config.hunting.rarities && config.hunting.rarities[rarity] && config.hunting.rarities[rarity].color) {
                rarityColor = parseInt(config.hunting.rarities[rarity].color.slice(1), 16);
            }

            // Get rarity name safely
            let rarityName = rarity.charAt(0).toUpperCase() + rarity.slice(1); // Default formatting
            if (config.hunting && config.hunting.rarities && config.hunting.rarities[rarity] && config.hunting.rarities[rarity].name) {
                rarityName = config.hunting.rarities[rarity].name;
            }

            const embed = new EmbedBuilder()
                .setColor(rarityColor)
                .setTitle('🎁 Pet Given Successfully!')
                .setDescription(`Successfully gave **${amount}x ${animal.name}** to **${target.username}**!`)
                .addFields(
                    {
                        name: '🦊 Pet Details',
                        value: [
                            `**Animal:** ${animal.emoji} ${animal.name}`,
                            `**Rarity:** ${rarityName}`,
                            `**Amount:** ${amount}`,
                            `**Individual Value:** ${animal.value.toLocaleString()} coins`,
                            `**Total Value:** ${totalValue.toLocaleString()} coins`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '👤 Recipient',
                        value: [
                            `**Username:** ${target.username}`,
                            `**User ID:** ${target.id}`,
                            `**Total Animals:** ${database.getUser(target.id).totalAnimalsFound || 0}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🔧 Admin Action',
                        value: [
                            `**Admin:** ${message.author.username}`,
                            `**Action:** Give Pet`,
                            `**Timestamp:** <t:${Math.floor(Date.now() / 1000)}:F>`
                        ].join('\n'),
                        inline: false
                    }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: `Admin command executed by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            await message.reply({ embeds: [embed] });

            // Log the admin action
            console.log(`[ADMIN] ${message.author.tag} gave ${target.tag} ${amount}x ${animalName} (${rarity})`);

            // Try to DM the user about the pet
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(rarityColor)
                    .setTitle('🎁 You Received a Pet!')
                    .setDescription(`An administrator gave you **${amount}x ${animal.name}**!`)
                    .addFields({
                        name: 'Pet Details',
                        value: [
                            `${animal.emoji} **${animal.name}**`,
                            `**Rarity:** ${rarityName}`,
                            `**Amount:** ${amount}`,
                            `**Value:** ${totalValue.toLocaleString()} coins`
                        ].join('\n'),
                        inline: false
                    })
                    .setFooter({ text: 'Check your zoo with "Kzoo"!' })
                    .setTimestamp();

                await target.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                // User has DMs disabled or other DM error, ignore silently
                console.log(`Could not send DM to ${target.username}: DMs disabled or other error`);
            }

        } catch (error) {
            console.error('Error in givepet command:', error);

            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Command Error',
                    description: 'An error occurred while giving the pet. Please check the console for details.',
                    timestamp: new Date()
                }]
            });
        }
    }
};