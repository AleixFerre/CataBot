const { MessageEmbed } = require('discord.js');
const { getColorFromCommand } = require('../../lib/common.js');
const TYPE = 'altres';

module.exports = {
  name: 'ping',
  description: 'Retorna el ping del servidor i de la API!',
  type: TYPE,
  aliases: ['status', 'estat', 'check'],
  execute(message) {
    let ping = Math.floor(message.client.ws.ping);

    const pingEmbed = new MessageEmbed()
      .setColor(getColorFromCommand(TYPE))
      .setTitle('**❌ Oof alguna cosa ha anat malament!**')
      .addField('❯ 🛰️ Ping Discord WS', `${ping} ms`, true)
      .setTimestamp()
      .setFooter(`CataBOT ${new Date().getFullYear()} © All rights reserved`);

    message.channel
      .send('🏓 Pong!')
      .then((m) => {
        pingEmbed
          .addField('❯ 📨 Ping Missatges', `${Math.floor(m.createdTimestamp - message.createdTimestamp)} ms`, true)
          .setTitle('**✅ Tot està funcionant correctament!**');
        m.channel.send(pingEmbed);
        m.delete();
      })
      .catch(console.error);
  },
};
