// cleanup-global.js
const { REST, Routes } = require('discord.js');
const { token, clientId } = require('./config/config.js');

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('🗑️ Removing all global commands...');
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    console.log('✅ Success! All global commands removed.');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
})();