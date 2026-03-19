// ===== IMPORTS =====
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const express = require('express');
const config = require('./config.json'); // opcional

// ===== PROCESS ERRORS =====
process.on('uncaughtException', (err) => console.error('💥 Erro não capturado:', err));
process.on('unhandledRejection', (err) => console.error('💥 Rejeição não tratada:', err));

// ===== EXPRESS KEEP-ALIVE =====
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('🤖 Bot online e servidor web ativo!'));
app.listen(PORT, () => console.log(`🌐 Web server online na porta ${PORT}`));

// ===== CLIENT DISCORD =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// Coleção de comandos
client.commands = new Collection();

// ===== CARREGAR COMANDOS =====
if (fs.existsSync('./commands')) {
  const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data && command.execute) client.commands.set(command.data.name, command);
  }
}

// ===== CARREGAR EVENTOS =====
if (fs.existsSync('./events')) {
  const eventFiles = fs.readdirSync('./events').filter(f => f.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (typeof event === 'function') event(client);
  }
}

// ===== LOGIN DO BOT =====
const token = process.env.BOT_TOKEN || config.BOT_TOKEN;
if (!token) {
  console.error('❌ BOT_TOKEN não definido!');
  process.exit(1);
}

console.log('🔑 Tentando logar o bot...');
client.login(token).catch(err => console.error('❌ Erro ao logar o bot:', err));
