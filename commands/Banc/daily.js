const Discord = require("discord.js");
const moment = require('moment');
const fs = require('fs');

module.exports = {
    name: 'daily',
    description: 'Recolleix la teva recompensa diaria!',
    type: 'banc',
    execute(message, args, servers, userData) {

        let content = "";
        moment.locale("ca");

        let server = servers[message.guild.id];

        if (userData[message.guild.id + message.member.id].lastDaily != moment().format('L')) {
            userData[message.guild.id + message.member.id].lastDaily = moment().format('L');
            userData[message.guild.id + message.member.id].money += 500;
            content = "💰500 monedes💰 han sigut afegides a la teva conta!\nGràcies per recollir la teva recompensa diaria!";
            message.channel.send(server.prefix + "progress 500 <@" + message.author.id + ">");
        } else {
            content = "Ja has recollit la teva recompensa diaria!\nPots tornar-hi " + moment().endOf('day').fromNow();
        }

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
            .setTitle("💰 **DAILY** 💰")
            .setDescription(content)
            .setTimestamp().setFooter("CataBOT 2020 © All rights reserved");

        fs.writeFile('Storage/userData.json', JSON.stringify(userData), (err) => { if (err) console.error(err); });
        message.channel.send(msg);
    },
};