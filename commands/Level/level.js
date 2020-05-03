const Discord = require("discord.js");

module.exports = {
    name: 'level',
    description: 'Et mostra el nivell que ets',
    type: 'level',
    aliases: ['xp', 'lvl'],
    execute(message, args, servers, userData) {

        let mention = {};
        let posicio = 1;

        if (message.mentions.users.first()) {
            mention = message.mentions.users.first();
        } else {
            mention = message.author;
        }

        if (mention.bot) {
            return message.reply("els Bots no tenen nivell... pobres Bots 😫");
        }

        let level = userData[message.guild.id + mention.id].level;
        let xp = userData[message.guild.id + mention.id].xp;

        message.guild.members.forEach(member => {
            if (userData[message.guild.id + member.id].level > level) {
                posicio++;
            } else if (userData[message.guild.id + member.id].level === level) {
                if (userData[message.guild.id + member.id].xp > xp) {
                    posicio++;
                }
            }
        });

        let progress = userData[message.guild.id + mention.id].xp / 10;

        function getRandomColor() {
            let letters = '0123456789ABCDEF';
            let color = '#';
            for (let i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }

        let msg = new Discord.RichEmbed()
            .setColor(getRandomColor())
            .setTitle("💠 Nivell 💠")
            .setThumbnail(mention.avatarURL)
            .addField('Conta', mention.username, true)
            .addField('Nivell', level, true)
            .addField('XP', xp, true)
            .addField('Rank', posicio, true)
            .addField('Progress', progress + "%", true)
            .setTimestamp().setFooter("CataBOT 2020 © All rights reserved");

        message.channel.send(msg);
    },
};