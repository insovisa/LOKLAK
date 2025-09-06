
const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'inv',
    aliases: ['inventory', 'item', 'items'],
    description: 'View your inventory and equipped items',
    usage: 'inv [page] or inv equip <item_id> or inv unequip <slot>',
    cooldown: 3000, // 3 seconds
    async execute(message, args, client) {
        const subCommand = args[0]?.toLowerCase();
        
        if (subCommand === 'equip') {
            return await handleEquip(message, args);
        } else if (subCommand === 'unequip') {
            return await handleUnequip(message, args);
        } else {
            return await showInventory(message, args);
        }
    }
};

// Add item to user's inventory
function addItemToInventory(userId, item) {
    const userData = database.getUser(userId);
    
    if (!userData.inventory) {
        userData.inventory = [];
    }
    
    // Generate unique ID for the item
    const itemId = Date.now() + Math.random().toString(36).substr(2, 5);
    const newItem = {
        id: itemId,
        ...item,
        obtainedAt: new Date().toISOString()
    };
    
    userData.inventory.push(newItem);
    database.saveUser(userData);
    
    return itemId;
}

// Get user's inventory
function getInventory(userId) {
    const userData = database.getUser(userId);
    return userData.inventory || [];
}

// Get equipped items
function getEquippedItems(userId) {
    const userData = database.getUser(userId);
    return userData.equipped || {};
}

// Equip an item
function equipItem(userId, itemId) {
    const userData = database.getUser(userId);
    const inventory = userData.inventory || [];
    const equipped = userData.equipped || {};
    
    const itemIndex = inventory.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return { success: false, message: 'Item not found in inventory' };
    
    const item = inventory[itemIndex];
    const slot = item.type.toLowerCase();
    
    // If there's already an item equipped in this slot, unequip it
    if (equipped[slot]) {
        inventory.push(equipped[slot]);
    }
    
    // Equip the new item
    equipped[slot] = item;
    inventory.splice(itemIndex, 1);
    
    userData.equipped = equipped;
    userData.inventory = inventory;
    database.saveUser(userData);
    
    return { success: true, item, slot };
}

// Unequip an item
function unequipItem(userId, slot) {
    const userData = database.getUser(userId);
    const equipped = userData.equipped || {};
    const inventory = userData.inventory || [];
    
    if (!equipped[slot]) {
        return { success: false, message: `No item equipped in ${slot} slot` };
    }
    
    const item = equipped[slot];
    delete equipped[slot];
    inventory.push(item);
    
    userData.equipped = equipped;
    userData.inventory = inventory;
    database.saveUser(userData);
    
    return { success: true, item, slot };
}

// Calculate total bonuses from equipped items
function calculateEquippedBonuses(userId) {
    const equipped = getEquippedItems(userId);
    const bonuses = {
        attack: 0,
        defense: 0,
        hp: 0,
        speed: 0,
        luck: 0,
        critRate: 0,
        evasion: 0
    };
    
    Object.values(equipped).forEach(item => {
        if (item.bonus) {
            Object.entries(item.bonus).forEach(([stat, value]) => {
                if (bonuses.hasOwnProperty(stat)) {
                    bonuses[stat] += value;
                }
            });
        }
    });
    
    return bonuses;
}

async function showInventory(message, args) {
    const inventory = getInventory(message.author.id);
    const equipped = getEquippedItems(message.author.id);
    const bonuses = calculateEquippedBonuses(message.author.id);
    
    const page = parseInt(args[0]) || 1;
    const itemsPerPage = 8;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = inventory.slice(startIndex, endIndex);
    const totalPages = Math.ceil(inventory.length / itemsPerPage);
    
    const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle(`🎒 ${message.author.username}'s Inventory`)
        .setThumbnail(message.author.displayAvatarURL());
    
    // Show equipped items
    const equippedText = Object.keys(equipped).length > 0 
        ? Object.entries(equipped).map(([slot, item]) => {
            const bonusText = Object.entries(item.bonus)
                .map(([stat, val]) => `+${val} ${stat}`)
                .join(', ');
            return `**${slot.charAt(0).toUpperCase() + slot.slice(1)}:** ${item.name} (${bonusText})`;
        }).join('\n')
        : 'No items equipped';
    
    embed.addFields({
        name: '⚔️ Equipped Items',
        value: equippedText,
        inline: false
    });
    
    // Show total bonuses
    const bonusText = Object.entries(bonuses)
        .filter(([stat, value]) => value > 0)
        .map(([stat, value]) => `+${value} ${stat}`)
        .join(', ') || 'None';
    
    embed.addFields({
        name: '📊 Total Bonuses',
        value: bonusText,
        inline: false
    });
    
    // Show inventory items
    if (pageItems.length > 0) {
        const inventoryText = pageItems.map((item, index) => {
            const bonusText = Object.entries(item.bonus)
                .map(([stat, val]) => `+${val} ${stat}`)
                .join(', ');
            return `**${startIndex + index + 1}.** ${item.name} (${item.type})\n   🔹 ID: \`${item.id}\` | Bonuses: ${bonusText}`;
        }).join('\n\n');
        
        embed.addFields({
            name: `🎁 Inventory Items (Page ${page}/${totalPages})`,
            value: inventoryText,
            inline: false
        });
    } else {
        embed.addFields({
            name: '🎁 Inventory Items',
            value: inventory.length === 0 ? 'Your inventory is empty!' : 'No items on this page.',
            inline: false
        });
    }
    
    embed.addFields({
        name: '📋 Commands',
        value: [
            '`Kinv` - View inventory',
            '`Kinv equip <item_id>` - Equip an item',
            '`Kinv unequip <slot>` - Unequip from slot',
            '`Kinv <page>` - View specific page'
        ].join('\n'),
        inline: false
    });
    
    embed.setFooter({
        text: `Total Items: ${inventory.length} | Use item IDs to equip/unequip`,
        iconURL: message.author.displayAvatarURL()
    });
    
    await message.reply({ embeds: [embed] });
}

async function handleEquip(message, args) {
    if (args.length < 2) {
        return message.reply({
            embeds: [{
                color: colors.error,
                title: '❌ Invalid Usage',
                description: 'Please provide an item ID to equip!\n**Usage:** `Kinv equip <item_id>`',
                timestamp: new Date()
            }]
        });
    }
    
    const itemId = args[1];
    const result = equipItem(message.author.id, itemId);
    
    if (!result.success) {
        return message.reply({
            embeds: [{
                color: colors.error,
                title: '❌ Equip Failed',
                description: result.message,
                timestamp: new Date()
            }]
        });
    }
    
    const bonusText = Object.entries(result.item.bonus)
        .map(([stat, val]) => `+${val} ${stat}`)
        .join(', ');
    
    const embed = new EmbedBuilder()
        .setColor(colors.success)
        .setTitle('⚔️ Item Equipped!')
        .setDescription(`Successfully equipped **${result.item.name}** in ${result.slot} slot!`)
        .addFields({
            name: '📊 Item Bonuses',
            value: bonusText,
            inline: false
        })
        .setFooter({
            text: 'Your stats have been updated!',
            iconURL: message.author.displayAvatarURL()
        })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

async function handleUnequip(message, args) {
    if (args.length < 2) {
        return message.reply({
            embeds: [{
                color: colors.error,
                title: '❌ Invalid Usage',
                description: 'Please provide a slot to unequip!\n**Usage:** `Kinv unequip <slot>`\n**Slots:** weapon, armor, shoe, accessory',
                timestamp: new Date()
            }]
        });
    }
    
    const slot = args[1].toLowerCase();
    const validSlots = ['weapon', 'armor', 'shoe', 'accessory'];
    
    if (!validSlots.includes(slot)) {
        return message.reply({
            embeds: [{
                color: colors.error,
                title: '❌ Invalid Slot',
                description: `Please provide a valid slot!\n**Valid Slots:** ${validSlots.join(', ')}`,
                timestamp: new Date()
            }]
        });
    }
    
    const result = unequipItem(message.author.id, slot);
    
    if (!result.success) {
        return message.reply({
            embeds: [{
                color: colors.error,
                title: '❌ Unequip Failed',
                description: result.message,
                timestamp: new Date()
            }]
        });
    }
    
    const embed = new EmbedBuilder()
        .setColor(colors.success)
        .setTitle('📦 Item Unequipped!')
        .setDescription(`Successfully unequipped **${result.item.name}** from ${result.slot} slot!`)
        .addFields({
            name: '📦 Item Returned',
            value: `${result.item.name} has been returned to your inventory.`,
            inline: false
        })
        .setFooter({
            text: 'Your stats have been updated!',
            iconURL: message.author.displayAvatarURL()
        })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

module.exports = {
    ...module.exports,
    addItemToInventory,
    getInventory,
    getEquippedItems,
    equipItem,
    unequipItem,
    calculateEquippedBonuses
};
