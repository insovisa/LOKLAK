const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger.js');

module.exports = (client) => {
    const eventsPath = path.join(__dirname, '..', 'events');
    
    try {
        if (!fs.existsSync(eventsPath)) {
            logger.warn('Events directory not found');
            return;
        }
        
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
        
        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            
            try {
                const event = require(filePath);
                
                // Validate event structure
                if (!event.name) {
                    logger.warn(`Event at ${filePath} is missing a name property`);
                    continue;
                }
                
                if (!event.execute) {
                    logger.warn(`Event ${event.name} at ${filePath} is missing an execute function`);
                    continue;
                }
                
                // Register the event
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }
                
                logger.info(`Loaded event: ${event.name}`);
                
            } catch (error) {
                logger.error(`Error loading event at ${filePath}:`, error);
            }
        }
        
        logger.info(`Successfully loaded ${eventFiles.length} events`);
        
    } catch (error) {
        logger.error('Error loading events:', error);
    }
};
