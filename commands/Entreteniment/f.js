const Discord = require("discord.js");

module.exports = {
    name: 'f',
    description: 'F en el chat chavales',
    usage: " [ description ]",
    type: 'entreteniment',
    execute(message, args) {

        function getRandomColor() {
            let letters = '0123456789ABCDEF';
            let color = '#';
            for (let i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }

        const msg = new Discord.MessageEmbed()
            .setColor(getRandomColor())
            .setTitle("**F**")
            .setDescription(args.join(" "))
            .setImage("https://media.giphy.com/media/j6ZlX8ghxNFRknObVk/giphy.gif")
            .setTimestamp().setFooter("CataBOT " + new Date().getFullYear() + " © All rights reserved");

        message.channel.send(msg);
    },
};