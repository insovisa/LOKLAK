const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'amongustwerk',
    aliases: ['atwerk', 'amongusdance', 'susdance', 'katwerk'],
    category: 'fun',
    description: 'Sends the Among Us twerking GIF',
    usage: 'kamongustwerk [@user]',
    cooldown: 5,

    async execute(message, args) {
        // The specific GIF URL you provided
        const gifUrl = 'https://i.pinimg.com/originals/8a/8b/27/8a8b2781551437b052d0ce67c355188e.gif';

        // Create embed
        const embed = new EmbedBuilder()
            .setColor('#FF0000') // Red color like Among Us
            .setTitle('🚨 Among Us Twerk Alert! 🍑')
            .setImage(gifUrl)

        // Check if user was mentioned
        if (message.mentions.users.size > 0) {
            embed.setDescription(`Hey ${message.mentions.users.first()}, ${message.author} is sending sus twerks your way!`);
        } else {
            embed.setDescription(`${message.author} is acting sus with those twerking moves!`);
        }

        // Send the message
        await message.channel.send({ embeds: [embed] });
    }
};