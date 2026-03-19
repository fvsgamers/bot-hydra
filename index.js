require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');

const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot online!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🌐 Web server online'));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.commands = new Collection();

// comandos
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// eventos
const eventFiles = fs.readdirSync('./events');
for (const file of eventFiles) {
  require(`./events/${file}`)(client);
}

process.on('unhandledRejection', (error) => {
  console.error('Erro não tratado:', error);
});

client.on('error', (error) => {
  console.error('Erro do client:', error);
});

if (!process.env.TOKEN) {
  console.error('❌ TOKEN não definido!');
  process.exit(1);
}

process.on('unhandledRejection', console.error);
client.on('error', console.error);

client.login(process.env.TOKEN);