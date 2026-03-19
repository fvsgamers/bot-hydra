//require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const express = require('express');

const app = express();

// ===== Keep-Alive (opcional no Discloud pago) =====
app.get('/', (req, res) => res.send('Bot online!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Web server online na porta ${PORT}`));

// ===== Criar cliente do Discord =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.commands = new Collection();

// ===== Carregar comandos =====
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// ===== Carregar eventos =====
const eventFiles = fs.readdirSync('./events');
for (const file of eventFiles) {
  require(`./events/${file}`)(client);
}

// ===== Tratamento de erros =====
process.on('unhandledRejection', console.error);
client.on('error', console.error);

// ===== Login do bot =====
if (!process.env.BOT_TOKEN) {
  console.error('❌ TOKEN não definido!');
  process.exit(1);
}

client.login(process.env.BOT_TOKEN)
  .then(() => console.log('🔑 Tentando logar o bot...'))
  .catch(err => console.error('❌ Erro ao logar o bot:', err));

client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});
