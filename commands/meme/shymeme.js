const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const colors = require("../../utils/colors.js");
const config = require("../../config/config.js");
const database = require("../../utils/database.js");
const fs = require('fs');
const path = require('path');

// Add your shy messages array (make sure this exists)
const shyMessages = [
    "😳 *blushes*",
    "💕 Aww so shy~",
    "👀 *hides face*",
    "🌸 So kawaii!",
    "✨ *sparkles shyly*"
    // Add more messages as needed
];

module.exports = {
    name: "shymeme",
    aliases: ["ksm"],
    description: "Send a random beksloy meme to someone",
    usage: "ksm <@user> [message]",
    cooldown: 3000,
    execute(message, args, client) {
        // Check if user mentioned someone
        if (args.length < 1 || message.mentions.users.size === 0) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: "🔥 shy Command",
                        description: "Please mention someone to beksloy!\n**Usage:** `Kbeksloy @user [message]` or `kkk @user [message]`\n**Example:** `kkk @friend You're so beksloy!`",
                        timestamp: new Date(),
                    },
                ],
            });
        }

        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(" ");

        // Check if user is trying to beksloy themselves
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [
                    {
                        color: colors.warning,
                        title: "bekbek",
                        description: "oun nis ot sov krub terk heh hei",
                        timestamp: new Date(),
                    },
                ],
            });
        }

        // Check if target is a bot
        if (target.bot) {
            return message.reply({
                embeds: [
                    {
                        color: colors.warning,
                        title: "🤖 hark mix jg ?",
                        description: "teii ng",
                        timestamp: new Date(),
                    },
                ],
            });
        }

        // Show loading embed first            
        message.reply({ embeds: [loadingEmbed] }).then(async (sentMessage) => {
            try {
                // Define the path to your images/gifs folder
                const imagesPath = path.join(__dirname, '../../assets'); // Added /shy subfolder
                
                // Function to get random image/gif from folder
                function getRandomImage() {
                    try {
                        // Check if directory exists
                        if (!fs.existsSync(imagesPath)) {
                            // Create the directory if it doesn't exist
                            fs.mkdirSync(imagesPath, { recursive: true });
                            throw new Error(`Created directory: ${imagesPath}. Please add some images!`);
                        }

                        // Read all files from the directory
                        const files = fs.readdirSync(imagesPath);
                        
                        // Filter for image/gif files (including webp)
                        const imageFiles = files.filter(file => {
                            const ext = path.extname(file).toLowerCase();
                            return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].includes(ext);
                        });
                        
                        if (imageFiles.length === 0) {
                            throw new Error('No image files found in assets/shy folder. Please add some images!');
                        }
                        
                        // Get random image
                        const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
                        return {
                            fullPath: path.join(imagesPath, randomImage),
                            fileName: randomImage,
                            extension: path.extname(randomImage).slice(1)
                        };
                    } catch (error) {
                        console.error('Error reading images directory:', error);
                        return null;
                    }
                }

                // Get random image
                const imageInfo = getRandomImage();
                
                if (!imageInfo) {
                    throw new Error('No images available in assets/shy folder');
                }

                // Create attachment from local file
                const imageAttachment = new AttachmentBuilder(imageInfo.fullPath, { 
                    name: `shy.${imageInfo.extension}`
                });

                const randomMessage = shyMessages[Math.floor(Math.random() * shyMessages.length)];

                // Create the final embed
                const shyEmbed = new EmbedBuilder()
                    .setColor(colors.warning)
                    .setTitle(`😳 ${message.author.username} is being shy to ${target.username}!`)
                    .setDescription(
                        `${randomMessage}` +
                        (customMessage ? `\n\n💭 *"${customMessage}"*` : "")
                    )
                    .setImage(`attachment://shy.${imageInfo.extension}`)
                    .setFooter({ 
                        text: "Aww~ So cute! 😊💕",
                        iconURL: message.author.displayAvatarURL({ dynamic: true })
                    })
                    .setTimestamp();

                // Edit the loading message with the final result
                await sentMessage.edit({ 
                    embeds: [shyEmbed], 
                    files: [imageAttachment]
                });
                
            } catch (error) {
                console.error("Error loading shy image:", error);

                // Fallback embed if something goes wrong
                const fallbackEmbed = new EmbedBuilder()
                    .setColor(colors.error)
                    .setDescription(
                        "Sorry, I couldn't load the shy image! 😢\n" +
                        `**Error:** ${error.message}\n\n` +
                        "Please make sure you have images in the `assets/shy/` folder with extensions: .png, .jpg, .jpeg, .gif, .webp"
                    );

                await sentMessage.edit({ embeds: [fallbackEmbed] });
            }
        });

        // Update user stats
        database.updateStats(message.author.id, "command");
    },
};