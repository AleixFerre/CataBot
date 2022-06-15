const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');
const { getColorFromCommand } = require('../../lib/common.js');
const { getUser, updateUser } = require('../../lib/database');

const TYPE = 'games';

// TODO: ES PODRIA TRADUIR LES PREGUNTES I RESPOSTES AL CATALÀ AMB EL PAQUET TRANSLATE

module.exports = {
	name: 'trivial',
	description: 'Joc 4: [BETA] Juga amb els teus amics al joc de les preguntes!',
	aliases: ['quiz', 'trivia', 'play4'],
	usage: '[ quantitat_preguntes ]',
	type: TYPE,
	async execute(message, args, server) {
		// Només cal ABCD, però per si un cas
		const emojis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫'];
		const lletres = ['a', 'b', 'c', 'd', 'e', 'f'];
		const recompensa = 50; // Punts que guanyes per cada resposta correcta
		const max_persones = 5; // Maxim de persones que hi pot haber jugat en una sala

		let preguntes = [];
		const participants = [message.author];
		const classificacio = [0];
		let n_preguntes = 10; // Quantitat de preguntes a realitar, per defecte 10
		const xp_recompensa = 50 * n_preguntes; // Recompensa que se li dona als participants al final en xp

		// Si ens entren un numero, posa aquest com a numero de preguntes
		if (args[0] && !isNaN(args[0])) {
			const n = parseInt(args[0]);
			if (n <= 50 && n >= 1) {
				n_preguntes = n;
			} else {
				return message.reply('la quantitat de preguntes ha de ser entre 1 i 50');
			}
		}

		const link = `https://opentdb.com/api.php?amount=${n_preguntes}&encode=base64`;

		await fetch(link)
			.then((response) => response.json())
			.then((json) => {
				preguntes = json.results;
			});

		// Sala d'espera per registrar les persones que es volen unir a la partida
		const index = await fase_sala();
		if (index === -1) {
			return message.channel.send('**PARTIDA CANCEL·LADA**');
		}
		// Quan ja tenim totes les persones a la sala, comencem a jugar!
		await comenca_joc();
		// Quan s'han respos les 10 preguntes, mostrem la classificacio
		await acabar_joc();

		async function fase_sala() {
			const embed_sala = new MessageEmbed()
				.setColor(getColorFromCommand(TYPE))
				.setTitle(`**TRIVIA AMB ${n_preguntes} PREGUNTES**`)
				.setDescription(
					`=> [🚪] UNIR-SE / SORTIR DE LA SALA
=> [✅] COMENÇAR PARTIDA
=> [❌] CANCEL·LAR**[ Màxim 5 persones per sala! ]**`,
				)
				.addField('❯ Participant 1: ', message.author.tag, false)
				.setTimestamp()
				.setFooter(`CataBOT ${new Date().getFullYear()} © All rights reserved`);

			const msg_sala = await message.channel.send(embed_sala);

			await msg_sala.react('🚪');
			await msg_sala.react('✅');
			await msg_sala.react('❌');

			// Esperem a una reacció
			const filter = (reaction, user) =>
				((reaction.emoji.name === '✅' && message.author.id === user.id) ||
					(reaction.emoji.name === '🚪' && message.author.id !== user.id) ||
					(reaction.emoji.name === '❌' && message.author.id === user.id)) &&
				!user.bot;

			let entra_joc = false;

			while (!entra_joc && participants.length < max_persones) {
				const collected = await msg_sala
					.awaitReactions(filter, {
						max: 1,
						time: 60000,
						errors: ['time'],
					})
					.catch(() => -1);

				// si ha acabat el temps, sortim
				if (collected === -1) {
					message.channel.send("S'ha acabat el temps! La pròxima vegada vés més ràpid!");
					msg_sala.delete();
					return -1;
				}

				// Si la reacció es ✅, entrem al joc
				const reaction = collected.first();
				if (reaction.emoji.name === '✅') {
					entra_joc = true;
				} else if (reaction.emoji.name === '🚪') {
					// Si la reacció es 🚪, entra/surt de la sala
					const i = participants.indexOf(reaction.users.cache.last());
					if (i === -1) {
						// No hi es, el posem
						participants.push(reaction.users.cache.last());
						classificacio.push(0);
					} else {
						// Ja hi era, el treiem
						participants.splice(i, 1);
						classificacio.pop();
					}
					await actualitzar_msg_sala(msg_sala);
				} else if (reaction.emoji.name === '❌') {
					msg_sala.delete();
					return -1;
				}
			}
			msg_sala.delete();
		}

		async function actualitzar_msg_sala(msg) {
			const embed = new MessageEmbed()
				.setColor(getColorFromCommand(TYPE))
				.setTitle('**TRIVIA**')
				.setDescription(
					`=> [🚪] UNIR-SE / SORTIR DE LA SALA
=> [✅] COMENÇAR PARTIDA
=> [❌] CANCEL·LAR**[ Màxim 5 persones per sala! ]**`,
				)
				.setTimestamp()
				.setFooter(`CataBOT ${new Date().getFullYear()} © All rights reserved`);

			for (let i = 0; i < participants.length; i++) {
				embed.addField(`❯ Participant ${i + 1}: `, participants[i].tag, false);
			}

			await msg.edit(embed);
		}

		// Anem mostrant els missatges i registrar els missatges dels participants
		async function comenca_joc() {
			for (let i = 0; i < n_preguntes; i++) {
				const [msg, respostes, q_index] = await envia_missatge_pregunta(i);
				const guanyador = await esperem_reaccions(msg, respostes, q_index); // retorna index del guanyador (-1 si ningu)
				if (guanyador !== -1) {
					classificacio[guanyador] += recompensa;
				}
			}
		}

		async function envia_missatge_pregunta(q_index) {
			const pregunta = preguntes[q_index];
			const buff = Buffer.from(pregunta.question, 'base64');
			const pregunta_decoded = buff.toString('ascii');

			const embed = new MessageEmbed()
				.setColor(getColorFromCommand(TYPE))
				.setTitle(`**TRIVIA - PREGUNTA ${q_index + 1}/${n_preguntes}**`)
				.setDescription(pregunta_decoded)
				.setTimestamp()
				.setFooter(`CataBOT ${new Date().getFullYear()} © All rights reserved`);

			let respostes = [];

			// Inserim les respostes incorrectes
			for (let i = 0; i < pregunta.incorrect_answers.length; i++) {
				respostes.push({
					name: pregunta.incorrect_answers[i],
					correct: false,
				});
			}

			// Inserim la resposta correcta
			respostes.push({
				name: pregunta.correct_answer,
				correct: true,
			});

			// Desordenem l'array de forma eficient fent servir l'algorisme de Fisher-Yates
			function shuffle(array) {
				for (let i = array.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[array[i], array[j]] = [array[j], array[i]];
				}
				return array;
			}

			// Desordenem l'objecte sense deixar de saber quina resposta és correcta
			respostes = shuffle(respostes);

			for (let i = 0; i < respostes.length; i++) {
				const buffer = Buffer.from(respostes[i].name, 'base64');
				const resposta_decoded = buffer.toString('ascii');
				embed.addField('❯ ' + emojis[i], resposta_decoded, true);
			}
			return [await message.channel.send(embed), respostes, q_index];
		}

		// Retorna si aquesta lletra és la solucio correcta
		function es_correcte(lletra, respostes) {
			const i = lletres.indexOf(lletra);
			return respostes[i].correct;
		}

		async function esperem_reaccions(msg, respostes, q_index) {
			const filter = (reactionMessage) =>
				lletres.includes(reactionMessage.content.toLowerCase()) &&
				participants.includes(reactionMessage.author) &&
				es_correcte(reactionMessage.content.toLowerCase(), respostes);

			const collected = await msg.channel
				.awaitMessages(filter, {
					max: 1,
					time: 60000,
					errors: ['time'],
				})
				.catch(() => -1);

			if (collected === -1) {
				await msg.delete();
				await message.channel.send("S'ha acabat el temps!");
				return -1;
			}

			// La resposta és correcta
			const guanyador = collected.first().author;
			await msg.channel.send(`${guanyador.username}, has encertat la pregunta ${q_index + 1}! \`+${recompensa}p\``);
			await msg.delete();
			return participants.indexOf(guanyador);
		}

		function insercioOrdenada(board, user, money) {
			// Pre:	0<=board.length<MAX, board[0..board.length-1] ordenat creixentment
			// Post:	x inserit ordenadament a board

			// Busquem la posicio on volem inserir
			let i = board.length;
			while (i > 0 && money > board[i - 1].money) {
				i--;
			}

			// Inserim a la posició corresponent
			const inserit = {
				user: user,
				money: money,
			};
			board.splice(i, 0, inserit);
			return board;
		}

		async function acabar_joc() {
			// mostrem la classificacio en ordre de qui te mes punts
			// sumem recompenses de monedes i xp a tots per igual

			let resultats = [];

			for (let i = 0; i < classificacio.length; i++) {
				resultats = insercioOrdenada(resultats, participants[i], classificacio[i]);
			}

			// Mostrar classificacio en pantalla
			// Per cada entrada de resultats
			// Mostrar posicio, nom i monedes

			const msg = new MessageEmbed()
				.setColor(getColorFromCommand(TYPE))
				.setTitle('🏆 Resultat de la partida 🏆')
				.setDescription('Només el primer recolleix el premi!')
				.setTimestamp()
				.setFooter(`CataBOT ${new Date().getFullYear()} © All rights reserved`);

			let i = 1;
			let recompenses_txt = '**RECOMPENSES**\n';
			const progresses = [];

			// 🥇 🥈 🥉

			await resultats.forEach(async (result) => {
				let num = i;
				if (i === 1) {
					num = '🥇';
					recompenses_txt += `${result.user.username}, has guanyat 💰\`${result.money} monedes\`💰!`;

					const user = await getUser(result.user.id, message.guild.id);
					user.money += result.money;
					await updateUser([result.user.id, message.guild.id], {
						money: user.money,
					});
				} else if (i === 2) {
					num = '🥈';
				} else if (i === 3) {
					num = '🥉';
				}
				msg.addField(`${num}.- ${result.user.username}`, result.money);
				progresses.push(`${server.prefix}progresa ${xp_recompensa} ${result.user}`);
				i++;
			});

			await message.channel.send(msg);
			message.channel.send(recompenses_txt);

			progresses.forEach((p) => {
				message.channel.send(p);
			});
		}
	},
};
