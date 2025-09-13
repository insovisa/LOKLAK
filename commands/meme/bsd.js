const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'kbd',
    aliases: ['bsd', 'beksloydance'],
    description: 'Sends a random beksloy dance GIF from a predefined list',
    
    async execute(message, args) {
        try {
            // Predefined list of #beksloydance GIF URLs
            const gifUrls = [
                'https://media.giphy.com/media/ZyaTZLqOE7X3SPLIQa/giphy.gif',
                'https://media.giphy.com/media/Ap5ztbZZvCK9BawPX4/giphy.gif',
                'https://media.giphy.com/media/qXcQSZJ6Ljm3dAcE4r/giphy.gif',
                'https://media.giphy.com/media/3OUIG1MrsMw2N9tlNU/giphy.gif',
                'https://media.giphy.com/media/bEgKvOtbIvbRXZ4VOf/giphy.gif',
                'https://media.giphy.com/media/P0pEeYEri43VdV6ScQ/giphy.gif',
                'https://media.giphy.com/media/UQyt1lpILxQYoheUA3/giphy.gif',
                'https://media.giphy.com/media/agWKYHXSq5HzaTNVbZ/giphy.gif',
                'https://media.giphy.com/media/Got8dlINbPe6J4LXu4/giphy.gif',
                'https://media.giphy.com/media/sTAVDENIYpx3iAGONw/giphy.gif',
                'https://media.giphy.com/media/kvQd7wbPJogB6h6OlO/giphy.gif'
            ];

            // Check if the list is not empty
            if (gifUrls.length === 0) {
                return message.reply('❌ No GIFs available!');
            }

            // Select a random GIF URL
            const randomGifUrl = gifUrls[Math.floor(Math.random() * gifUrls.length)];

            // Create embed with the GIF
            const embed = new EmbedBuilder()
                .setImage(randomGifUrl)
                .setFooter({ text: 'Powered by Giphy' });

            // Send the embed
            await message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Error in beksloy dance GIF command:', error);
            message.reply('❌ Failed to send GIF!');
        }
    }
};