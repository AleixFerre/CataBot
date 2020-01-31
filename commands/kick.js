module.exports = {
	name: 'kick',
	description: 'Expulsa permanentment un usuari del servidor',
	usage: '< @usuari > [ descripcio del kick ]',
	execute(message, args, servers) {

        let prefix = servers[message.guild.id].prefix;

        function kickHelp() {
            message.channel.send(prefix + 'help kick').then((msg) => {msg.delete();});
        }

        let user = message.mentions.users.first();

        if (user) {
            const member = message.guild.member(user);
            if (member) {
                if (!member.kickable)
                    return message.reply('No es pot fer fora a l\'usuari.');
                
                let kickmsg = 'Motiu del kick desconegut';
                if (args[0])
                    kickmsg = args[0];

                member.kick(kickmsg).then(() => {
                    // We let the message author know we were able to kick the person
                    message.reply("S'ha expulsat a " + user.username + " amb èxit.");
                }).catch((err) => {
                    // An error happened
                    // This is generally due to the bot not being able to kick the member,
                    // either due to missing permissions or role hierarchy
                    message.reply('No es pot expulsar al membre.\nTens permisos?\nProva-ho manualment.');
                    kickHelp();
                    // Log the error
                    console.error(err);
                });
            } else {
                // The mentioned user isn't in this guild
                message.reply('Aquesta persona no pertany al servidor');
                kickHelp();
            }
        // Otherwise, if no user was mentioned
        } else {
            message.reply('Menciona a la persona que vols fer fora!');
            kickHelp();
        }
	},
};