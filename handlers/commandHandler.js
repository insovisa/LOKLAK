const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger.js');

module.exports = (client) => {
    const commandsPath = path.join(__dirname, '..', 'commands');
    
    // Function to recursively load commands from all subdirectories
    function loadCommands(dir) {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
            const itemPath = path.join(dir, item.name);
            
            if (item.isDirectory()) {
                // Recursively load commands from subdirectories
                loadCommands(itemPath);
            } else if (item.isFile() && item.name.endsWith('.js')) {
                try {
                    const command = require(itemPath);
                    
                    // Validate command structure
                    if (!command.name) {
                        logger.warn(`Command at ${itemPath} is missing a name property`);
                        continue;
                    }
                    
                    if (!command.execute) {
                        logger.warn(`Command ${command.name} at ${itemPath} is missing an execute function`);
                        continue;
                    }
                    
                    // Set the command in the collection
                    client.commands.set(command.name, command);
                    
                    // Also set aliases if they exist
                    if (command.aliases && Array.isArray(command.aliases)) {
                        for (const alias of command.aliases) {
                            client.commands.set(alias, command);
                        }
                    }
                    
                    logger.info(`Loaded command: ${command.name}`);
                    
                } catch (error) {
                    logger.error(`Error loading command at ${itemPath}:`, error);
                }
            }
        }
    }
    
    try {
        if (fs.existsSync(commandsPath)) {
            loadCommands(commandsPath);
            logger.info(`Successfully loaded ${client.commands.size} commands`);
        } else {
            logger.warn('Commands directory not found');
        }
    } catch (error) {
        logger.error('Error loading commands:', error);
    }
};
