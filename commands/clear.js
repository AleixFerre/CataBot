module.exports = {
	name: 'clear',
	description: 'Esborra tota la cua',
	execute(message,args,servers) {
        message.channel.send("Borrant la cua...").then((msg) => {
            let server = servers[message.guild.id];
            if (message.guild.voiceConnection) {
                if (server.queue.length > 0) {
                    for(var i = server.queue.length-1; i>=0; i--) {
                        server.queue.splice(i,1);
                    }
                    msg.edit("S'ha borrat la cua correctament!");
                } else {
                    msg.edit("No hi ha elements a la cua!");
                }
            } else {
                msg.edit("Has d'estar en un canal de veu amb el bot!");
            }
        }).catch(console.error);
	},
};