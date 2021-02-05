const Discord = require("discord.js");
const { getRandomColor } = require('../../common.js');

module.exports = {
    name: 'f',
    description: 'F en el chat chavales',
    usage: " [ description ]",
    type: 'entreteniment',
    execute(message, args) {

        const msg = new Discord.MessageEmbed()
            .setColor(getRandomColor())
            .setTitle("**F**")
            .setDescription(args.join(" "))
            .setImage("https://media.giphy.com/media/j6ZlX8ghxNFRknObVk/giphy.gif")
            .setTimestamp().setFooter("CataBOT " + new Date().getFullYear() + " © All rights reserved");

        message.channel.send(msg);
    },
};