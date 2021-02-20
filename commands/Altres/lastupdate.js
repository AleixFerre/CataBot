const fs = require("fs");
const Discord = require('discord.js');
const {
    getRandomColor, getServerPrefix
} = require("../../common.js");

module.exports = {
    name: 'lastupdate',
    description: 'Mostra les notes de la ultima actualització del bot',
    type: 'altres',
    cooldown: 10,
    aliases: ['parche', 'notes', 'changes', 'changelog', 'canvis'],
    execute(message, _args, servers) {

        let prefix = getServerPrefix(message, servers);

        let changes = fs.readFileSync("CHANGELOG.md")
            .toString().split("[")[1].split("]");

        let versio = changes[0].replace("\\", "").trim();

        const embed = new Discord.MessageEmbed()
            .setColor(getRandomColor())
            .setTitle("**NOTES DEL CATABOT " + versio + "**")
            .setTimestamp().setFooter('CataBOT ' + new Date().getFullYear() + ' © All rights reserved');

        changes = changes[1].replace("\\", "")
            .replace(/-/ig, "❯")
            .replace(/  ❯/ig, "•")
            .replace(/ÇÇ/ig, prefix)
            .trim()
            .split("\n");

        let notes = [];
        for (let change of changes) {
            if (change[0] === "❯") {
                notes.push({
                    titol: change,
                    cos: ""
                });
            } else {
                notes[notes.length-1].cos += change;
            }
        }

        for (let nota of notes) {
            embed.addField(nota.titol, nota.cos || "_No hi ha més informació._", false);
        }

        message.channel.send(embed);
    }
};