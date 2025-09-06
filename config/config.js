module.exports = {
    // Bot Configuration
    token: process.env.DISCORD_TOKEN || 'YOUR_ACTUAL_BOT_TOKEN_HERE',
    prefix: ['k', 'K'],
    clientId: process.env.CLIENT_ID || '1399459454889754805',
    guildId: process.env.GUILD_ID || '1240627007340150785',

    
    // Short prefixes for specific commands
    shortPrefixes: {
        hp: 'help',
        cf: 'coinflip',
        s: 'slots',
        d: 'daily',
        w: 'weekly',
        hunt: 'hunt',
        zoo: 'zoo',
        h: 'coinflip heads',
        t: 'coinflip tails'
    },
    
    adminIds: [
        process.env.ADMIN_ID_1,
        process.env.ADMIN_ID_2,
        process.env.ADMIN_ID_3,
        process.env.ADMIN_ID_4
    ].filter(Boolean), // This will filter out any undefined values

                                                                          
    // API Keys
    giphyApiKey: process.env.GIPHY_API_KEY || 'default_giphy_key',
    googleApiKey: process.env.GOOGLE_API_KEY || 'default_google_key',
    
    // Economy Configuration
    economy: {
        currency: 'riel',
        currencySymbol: '💲',
        maxBet: 250000,
        dailyReward: {
            min: 1000,
            max: 5000
        },
        weeklyReward: {
            min: 10000,
            max: 25000
        },
        workReward: {
            min: 100,
            max: 1000
        }
    },
    
    // Gambling Configuration
    gambling: {
        coinflip: {
            minBet: 1,
            maxBet: 250000
        },
        slots: {
            minBet: 1,
            maxBet: 250000,
            symbols: {
                diamond: { emoji: '💎', multiplier: 10, weight: 1 },
                rocket: { emoji: '🚀', multiplier: 5, weight: 3 },
                coin: { emoji: '🪙', multiplier: 2, weight: 10 },
                skull: { emoji: '💀', multiplier: 0, weight: 15 }
            }
        },
        dice: {
            minBet: 1,
            maxBet: 250000
        }
    },
    
    // Hunting Configuration
    hunting: {
        cooldown: 10000, // 10 seconds
        distractionChance: 0.3, // 30% chance of distraction
        rarities: {
            common: { name: 'Common', color: '#808080', value: 100, weight: 40 },
            uncommon: { name: 'Uncommon', color: '#00FF00', value: 500, weight: 25 },
            rare: { name: 'Rare', color: '#0099FF', value: 1500, weight: 15 },
            epic: { name: 'Epic', color: '#9932CC', value: 5000, weight: 10 },
            legendary: { name: 'Legendary', color: '#FF8C00', value: 15000, weight: 6 },
            mythical: { name: 'Mythical', color: '#FF0000', value: 50000, weight: 3 },
            priceless: { name: 'Priceless', color: '#FFD700', value: 100000, weight: 1 }
        }
    },
    
    // Colors (Discord theme)
    colors: {
        primary: '#7289DA',    // Discord blurple
        secondary: '#99AAB5',  // Discord grey
        success: '#43B581',    // Discord green
        error: '#F04747',      // Discord red
        warning: '#FAA61A',    // Discord yellow
        embed: '#2C2F33'       // Dark grey
    },
    
    // Bot Information
    botInfo: {
        name: 'KsaekVat Bot',
        version: '1.0.0',
        description: 'A Discord bot inspired by OwO bot with gambling, economy, and fun commands!',
        author: 'KsaekVat Team'
    }
};
