import * as fs from 'fs';
import Discord from 'discord.js';
import Tournament from './tournament.js';

const client = new Discord.Client();
const config = {};
const guildMap = {};

(async () => {
  const contents = await fs.promises.readFile('config.json', 'utf8');
  Object.assign(config, JSON.parse(contents));
  client.login(config.auth);
})()

client.once('ready', () => {
  console.log('Ready!');
});

client.on('ready', () => {
  console.log('connected');
  client.guilds.cache.each((g) => {
    if (g.available) {
      guildMap[g.id] = guildMap[g.id] || {};
      guildMap[g.id].tournament = new Tournament();

      let staffRole = g.roles.cache.find((role) => role.name === config.role);
      if (staffRole) {
        guildMap[g.id].role = staffRole.id;
      } else {
        g.roles.create({
          data: {
            name: config.role,
            color: 'YELLOW',
          },
          reason: 'The bot needs a Staff role for special actions',
        })
          .then((r) => {
            console.log('Created missing Staff role for guild');
            guildMap[g.id].role = r.id;
          })
          .catch(console.error);
      }
    }
  });
});

const allowMentions = { allowedMentions: { parse: ['users'] } };

client.on('message', async message => {
  console.log(message.content);
  const guild = guildMap[message.guild.id];

  // - !checkin (ORGANIZER - se nao houver torneio a decorrer, cria um torneio)
  if (message.content === '!checkin' && message.member.roles.cache.has(guild.role)) {
    message.channel.send(guild.tournament.checkin());
  }

  // - !join (PLAYER - o jogador junta-se ao torneio a decorrer)
  if (message.content === '!join') {
    message.channel.send(guild.tournament.add(message.author), allowMentions);
  }

  // - !standings (ANY - mostra standings atuais)
  if (message.content === '!standings' && message.member.roles.cache.has(guild.role)) {
    const [header, rows] = guild.tournament.standings();
    await message.channel.send(header, allowMentions)
    for (const row of rows) {
      await message.channel.send(row, allowMentions);
    }
  }

  // - !start (ORGANIZER - se o torneio estiver em modo checkin, passa para o modo playing,
  //   debitando a lista de jogadores inscritos sob a forma de pairings para a primeira ronda)
  if (message.content === '!start' && message.member.roles.cache.has(guild.role)) {
    const [header, rows] = guild.tournament.start();
    await message.channel.send(header, allowMentions)
    for (const row of rows) {
      await message.channel.send(row, allowMentions);
    }
  }

  // - !result [1-0-0, 2-0-0 , etc] (JOGADOR o jogador envia o resultado para o bot, o bot fica com o
  //   resultado nao aprovado, e manda mensagem ao oponente para que este aprove (y/n), se o oponente
  //   aprovar, fica o resultado em modo definitivo, senao o resultado é apagado e o primeiro jogador notificado)
  if (message.content.startsWith('!result')) {
    const [_, result] = message.content.split(' ');
    const [output, opponent] = guild.tournament.submitResult(message.author, ...(result.split('-')));
    const filter = (reaction, user) => (user.id === opponent.id);
    const reply = await message.channel.send(output, allowMentions);
    await reply.react('👍');
    await reply.react('👎');
    const collector = reply.createReactionCollector(filter, { time: 20000, max: 1 })

    collector.on('collect', (reaction, user) => {
      if (reaction.emoji.name === '👍') {
        message.channel.send(guild.tournament.confirmResult(opponent), allowMentions)
      }
      if (reaction.emoji.name === '👎') {
        message.channel.send(guild.tournament.denyResult(opponent), allowMentions)
      }
    });
  }

  // - !next (ORGANIZADOR, o torneio avanca para a proxima ronda, se houver resultados em falta,
  //   sao automaticamente empate. Se a ronda anterior for a ultima, o torneio acaba e mostra os standings finais)
  if (message.content === '!next' && message.member.roles.cache.has(guild.role)) {
    const [header, rows] = guild.tournament.nextRound();
    await message.channel.send(header, allowMentions)
    for (const row of rows) {
      await message.channel.send(row, allowMentions);
    }
  }

  if (message.content.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").indexOf('marcia') !== -1) {
    const url = config.marcia[Math.floor(Math.random() * (config.marcia.length + 1))];
    const emb = new Discord.MessageEmbed().setImage(url);
    message.channel.send(emb);
  }
});
