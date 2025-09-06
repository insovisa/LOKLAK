// deploy-dm-only.js
const { REST, Routes } = require('discord.js');
const { token, clientId } = require('./config/config.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands/slash');

// Load commands and convert to DM-only format
fs.readdirSync(commandsPath)
  .filter(file => file.endsWith('.js'))
  .forEach(file => {
    try {
      const command = require(`${commandsPath}/${file}`);
      const cmdData = command.data.toJSON();
      
      commands.push({
        ...cmdData,
        dm_permission: true,       // Only works in DMs
        default_member_permissions: '0' // Admin-only
      });
      
      console.log(`🔒 Prepared DM-only command: ${cmdData.name}`);
    } catch (error) {
      console.error(`⚠️ Error loading ${file}:`, error.message);
    }
  });

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('🚀 Deploying DM-only admin commands...');
    
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    
    console.log('✅ Success! Commands are now:');
    console.log('   - Only available in DMs');
    console.log('   - Completely hidden in servers');
    console.log('   - Only usable by admins');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
})();