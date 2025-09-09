const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'kkj',
    aliases: ['shy', 'shymeme'],
    description: 'Sends a random shy meme',
    
    async execute(message, args) {
        try {
            // Path to your memes folder (adjust this path as needed)
            const memesPath = path.join(__dirname, '../../assets/shy-meme');
            
            // Check if the memes folder exists
            if (!fs.existsSync(memesPath)) {
                return message.reply('❌ Memes folder not found! Please create the folder: `assets/shy-memes`');
            }
            
            // Get all image files from the folder
            const files = fs.readdirSync(memesPath).filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
            });
            
            // Check if there are any image files
            if (files.length === 0) {
                return message.reply('❌ No memes found in the folder!');
            }
            
            // Select a random file
            const randomFile = files[Math.floor(Math.random() * files.length)];
            const filePath = path.join(memesPath, randomFile);
            
            // Send the image without any embed
            await message.channel.send({
                files: [{
                    attachment: filePath,
                    name: randomFile
                }]
            });
            
        } catch (error) {
            console.error('Error in shy meme command:', error);
            message.reply('❌ Failed to send meme!');
        }
    }
};