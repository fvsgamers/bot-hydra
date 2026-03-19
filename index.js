const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const express = require('express');

// Configurações (se você tiver config.json)
const config = require('./config.json');

// ===== Express Keep-Alive =====
const app = express();
app.get('/', (req, res) => res.send('Bot online!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Web server online na porta ${PORT}`));

// ===== Cliente do Discord =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.commands = new Collection();

// ===== Carregar comandos =====
if (fs.existsSync('./commands')) {
  const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
  }
}

// ===== Carregar eventos =====
if (fs.existsSync('./events')) {
  const eventFiles = fs.readdirSync('./events').filter(f => f.endsWith('.js'));
  for (const file of eventFiles) {
    require(`./events/${file}`)(client);
  }
}

// ===== Tratamento de erros =====
process.on('unhandledRejection', console.error);
client.on('error', console.error);

// ===== Login do bot =====
if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN não definido! Configure no painel do Render.');
  process.exit(1);
}

client.login(process.env.BOT_TOKEN)
  .then(() => console.log('🔑 Tentando logar o bot...'))
  .catch(err => console.error('❌ Erro ao logar o bot:', err));

client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});
