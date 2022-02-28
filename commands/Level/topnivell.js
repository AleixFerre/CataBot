const { MessageEmbed } = require('discord.js');
const { getColorFromCommand } = require('../../lib/common.js');
const { getUsersFromServer } = require('../../lib/database.js');

const TYPE = 'level';

module.exports = {
	name: 'topnivell',
	description: 'Mostra la classificació de nivell del servidor',
	aliases: ['xpl', 'toplevel'],
	type: TYPE,
	usage: '[ quantitat ]',
	async execute(message, args, server) {
		const board = [];
		let size = 10;

		if (args[0] && !isNaN(args[0])) {
			size = parseInt(args[0]);
		}

		if (size > 10 || size <= 0) {
			message.reply('la mida ha de ser entre 1 i 10');
			return message.channel.send(`${server.prefix}help xpl`);
		}

		if (!message.guild.available) {
			message.reply('el servidor no està disponible!');
			return;
		}

		// ALGORISME per Inserció Directa || O(N) Optimized algorithm [we can also multiply N with 10 but is a constant value, but with the O notation, we don't keep it]
		// Per cada usuari del servidor (en el que s'ha enviat el missatge)
		// inserció ordenada per monedes // O(array_lenght(10)) but only with 10 elements max [max length fixed with the leaderboard]
		// si la mida de la taula > 10
		// pop_back (l'ultim)
		// La taula s'ha de mantenir sempre amb 10 elements com a maxim
		// Mostrar la info amb un embed corresponent

		function insercioOrdenada(user, nom) {
			// Pre:	0<=board.length<MAX, board[0..board.length-1] ordenat creixentment
			// Post:	x inserit ordenadament a board

			if (user.money === -1) return;

			// Busquem la posicio on volem inserir
			let i = board.length;
			while (i > 0 && user.level * 1000 + user.xp > board[i - 1].level * 1000 + board[i - 1].xp) {
				i--;
			}

			// Inserim a la posició corresponent
			const inserit = {
				level: user.level,
				xp: user.xp,
				name: nom,
			};
			board.splice(i, 0, inserit);
		}

		const usersData = await getUsersFromServer(message.guild.id);

		for await (const member of usersData) {
			// Per cada membre del servidor, apliquem aquesta funció
			const resolvedMember = await message.guild.members.resolve(member.IDs.userID);
			if (resolvedMember) {
				insercioOrdenada(member, resolvedMember.user.username);

				// Mantenim la taula sempre com a maxim amb size elements
				// This is really an IF statement but just in case
				while (board.length > size) {
					board.pop();
				}
			}
		}

		const msg = new MessageEmbed()
			.setColor(getColorFromCommand(TYPE))
			.setTitle(`💠 Classificació de ${message.guild.name} 💠`)
			.setTimestamp()
			.setFooter(`CataBOT ${new Date().getFullYear()} © All rights reserved`);

		let i = 1;

		// 🥇 🥈 🥉

		board.forEach((user) => {
			let num = i;
			if (i === 1) {
				num = '🥇';
			} else if (i === 2) {
				num = '🥈';
			} else if (i === 3) {
				num = '🥉';
			}
			msg.addField(`${num}.- ${user.name}`, `Nivell: ${user.level} - ${user.xp}xp`);
			i++;
		});

		message.channel.send(msg);
	},
};
