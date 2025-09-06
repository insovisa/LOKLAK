// Simple in-memory cooldown system
const cooldowns = new Map();

module.exports = {
    // Set a cooldown for a specific key (usually userId-commandName)
    setCooldown: (key) => {
        cooldowns.set(key, Date.now());
    },
    
    // Check if a key is on cooldown
    isOnCooldown: (key, cooldownTime) => {
        if (!cooldowns.has(key)) return false;
        
        const lastUsed = cooldowns.get(key);
        const timeLeft = (lastUsed + cooldownTime) - Date.now();
        
        if (timeLeft <= 0) {
            cooldowns.delete(key);
            return false;
        }
        
        return true;
    },
    
    // Get remaining cooldown time in milliseconds
    getTimeLeft: (key, cooldownTime) => {
        if (!cooldowns.has(key)) return 0;
        
        const lastUsed = cooldowns.get(key);
        const timeLeft = (lastUsed + cooldownTime) - Date.now();
        
        return Math.max(0, timeLeft);
    },
    
    // Clear all cooldowns (useful for testing or admin commands)
    clearAll: () => {
        cooldowns.clear();
    },
    
    // Clear cooldown for specific key
    clear: (key) => {
        cooldowns.delete(key);
    }
};
