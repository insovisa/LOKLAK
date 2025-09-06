const logger = require('../utils/logger.js');
module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        // Use success logger for better visibility
        logger.success(`🤖 Bot ${client.user.tag} is ready!`);
        logger.success(`📊 Serving ${client.guilds.cache.size} guilds`);
        logger.success(`👥 Watching ${client.users.cache.size} users`);
        
        // Also add console.log for immediate visibility
        console.log(`🎉 === BOT READY === 🎉`);
        console.log(`✅ Bot: ${client.user.tag}`);
        console.log(`📊 Guilds: ${client.guilds.cache.size}`);
        console.log(`👥 Users: ${client.users.cache.size}`);
        
        // Set bot activity
        try {
            client.user.setActivity('KsaekVat | K help', { type: 'PLAYING' });
            logger.success('🎮 Bot activity set successfully');
            console.log('🎮 Activity: KsaekVat | K help');
        } catch (error) {
            logger.error('Failed to set bot activity', error);
        }
    }
};