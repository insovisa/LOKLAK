const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config.js');
const logger = require('./utils/logger.js');
const database = require('./utils/database.js');
const cron = require('node-cron');
const express = require('express');
require('dotenv').config();

// Add this to the TOP of your index.js (right after the requires)

// Auto-deploy slash commands
async function deployCommands() {
  const { REST, Routes } = require("discord.js");
  const fs = require("fs");
  const path = require("path");

  try {
    const commands = [];
    const commandsPath = path.join(__dirname, "commands/slash");
    
    if (!fs.existsSync(commandsPath)) {
      console.log('No slash commands directory found');
      return;
    }
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
      try {
        const command = require(`./commands/slash/${file}`);
        if (command.data && typeof command.data.toJSON === "function") {
          const commandJSON = command.data.toJSON();
          commands.push(commandJSON);
          console.log(`✅ Loaded command: ${commandJSON.name}`);
        } else {
          console.warn(`[WARN] Skipped ${file}: Invalid command structure`);
        }
      } catch (error) {
        console.warn(`[WARN] Failed to load ${file}: ${error.message}`);
      }
    }

    if (commands.length === 0) {
      console.log('No valid commands found to deploy');
      return;
    }

    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
    const clientId = process.env.CLIENT_ID;

    console.log(`🔄 Deploying ${commands.length} slash commands...`);

    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log("✅ Slash commands deployed successfully!");

  } catch (error) {
    console.error("❌ Error deploying commands:", error);
  }
}

// Deploy commands on startup
deployCommands();

// HTTP server for Railway health checks
const app = express();
app.get('/', (req, res) => res.status(200).send('Bot is running'));
app.listen(process.env.PORT || 8080, '0.0.0.0', () => {
  console.log(`Server on port ${process.env.PORT || 8080}`);
});

// Multiple instance prevention
const pidFile = './bot.pid';
if (fs.existsSync(pidFile)) {
  const pid = fs.readFileSync(pidFile, 'utf8').trim();
  try {
    process.kill(pid, 0);
    console.log('❌ Bot is already running!');
    console.log(`❌ PID: ${pid}`);
    console.log('❌ Please stop the existing bot first or delete bot.pid file');
    process.exit(1);
  } catch {
    console.log('🧹 Removing stale PID file...');
    fs.unlinkSync(pidFile);
  }
}
fs.writeFileSync(pidFile, process.pid.toString());
console.log(`🤖 Bot starting with PID: ${process.pid}`);
const cleanup = () => {
  if (fs.existsSync(pidFile)) {
    console.log('🧹 Cleaning up PID file...');
    fs.unlinkSync(pidFile);
  }
};
process.on('exit', cleanup);
process.on('SIGINT', () => { console.log('\n🛑 SIGINT'); cleanup(); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n🛑 SIGTERM'); cleanup(); process.exit(0); });

// Discord bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// Initialize collections
client.commands = new Collection();
client.slashCommands = new Collection();
client.cooldowns = new Collection();

// Load slash commands
const slashPath = path.join(__dirname, 'commands/slash');
if (fs.existsSync(slashPath)) {
  const slashFiles = fs.readdirSync(slashPath).filter(file => file.endsWith('.js'));
  for (const file of slashFiles) {
    try {
      const command = require(`./commands/slash/${file}`);
      if (command.data && command.data.name && command.execute) {
        client.slashCommands.set(command.data.name, command);
        console.log(`✅ Loaded slash command: ${command.data.name}`);
      } else {
        console.warn(`[WARN] Skipped ${file}: Missing data.name or execute`);
      }
    } catch (error) {
      console.warn(`[WARN] Failed to load ${file}: ${error.message}`);
    }
  }
}

// Load handlers
console.log('🔧 Loading commandHandler...');
require('./handlers/commandHandler.js')(client);
console.log(`🔧 Commands loaded: ${client.commands.size}`);
console.log('🔧 Loading eventHandler...');
require('./handlers/eventHandler.js')(client);
console.log('🔧 Events loaded successfully');

// Cron jobs
cron.schedule('0 0 * * *', () => {
  logger.info('Resetting daily rewards');
  const users = database.getAllUsers();
  users.forEach(u => { u.dailyClaimed = false; database.saveUser(u); });
  logger.info(`Reset for ${users.length} users`);
});
cron.schedule('0 0 * * 0', () => {
  logger.info('Resetting weekly rewards');
  const users = database.getAllUsers();
  users.forEach(u => { u.weeklyClaimed = false; database.saveUser(u); });
  logger.info(`Reset for ${users.length} users`);
});
cron.schedule('0 * * * *', () => {
  const users = database.getAllUsers();
  let expired = 0;
  users.forEach(u => {
    if (u.boosters) {
      if (u.boosters.money && u.boosters.money.expiresAt < Date.now()) {
        delete u.boosters.money; expired++;
      }
      if (u.boosters.exp && u.boosters.exp.expiresAt < Date.now()) {
        delete u.boosters.exp; expired++;
      }
      database.saveUser(u);
    }
  });
  if (expired > 0) logger.info(`Expired ${expired} boosters`);
});

// Error handling
process.on('uncaughtException', err => logger.error('Uncaught Exception:', err));
process.on('unhandledRejection', err => logger.error('Unhandled Rejection:', err));

// Slash command handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;
  
  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(`Error executing ${interaction.commandName}:`, error);
    const msg = { content: '❌ Error executing command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
    else await interaction.reply(msg);
  }
});

// Login
const token = process.env.DISCORD_TOKEN;
if (!token) {
  logger.error('❌ No token found!');
  cleanup();
  process.exit(1);
}
logger.info('🔗 Connecting...');
client.login(token)
  .then(() => {
    logger.info('✅ Logged in!');
    console.log(`🎉 Bot ready! PID: ${process.pid}`);
  })
  .catch(err => {
    logger.error('❌ Failed to login:', err);
    cleanup();
    process.exit(1);
  });

// Ready event
client.once('ready', () => {
  console.log(`🚀 ${client.user.tag} is online!`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
});

// Reaction events
client.on('messageReactionAdd', (reaction, user) => {
  console.log(`🔥 Reaction added: ${reaction.emoji.name} by ${user.username}`);
});
client.on('messageReactionRemove', (reaction, user) => {
  console.log(`❌ Reaction removed: ${reaction.emoji.name} by ${user.username}`);
});