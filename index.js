// index.js
require('dotenv').config(); // Para rodar localmente. No Render, TOKEN vem do Environment

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const config = require('./config.json'); // IDs e configurações do bot
const express = require('express');

// ======== KEEP-ALIVE COM EXPRESS ========
const app = express();
app.get('/', (req, res) => {
  res.send('Bot online!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Web server online na porta ${PORT}`));

// ======== CRIAR CLIENT DO DISCORD ========
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// ======== CARREGAR COMANDOS ========
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// ======== CARREGAR EVENTOS ========
const eventFiles = fs.readdirSync('./events');
for (const file of eventFiles) {
  require(`./events/${file}`)(client);
}

// ======== TRATAMENTO DE ERROS ========
process.on('unhandledRejection', (error) => console.error('Unhandled Rejection:', error));
client.on('error', (error) => console.error('Client Error:', error));

// ======== CHECAR TOKEN ========
if (!process.env.TOKEN) {
  console.error('❌ TOKEN não definido!');
  process.exit(1);
}

// ======== LOGIN ========
client.login(process.env.TOKEN)
  .then(() => console.log('🔑 Tentando logar o bot...'))
  .catch(err => console.error('❌ Erro ao logar o bot:', err));

// ======== READY EVENT ========
client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

// ======== MENSAGEM DE PING (opcional, para testes) ========
client.on('messageCreate', message => {
  if (message.content === '!ping') {
    message.reply('Pong! 🏓');
  }
});
