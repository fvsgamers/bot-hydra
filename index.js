// ===== IMPORTS =====
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const express = require('express');
//require('dotenv').config(); // Caso queira usar .env para o token
console.log('🚀 Iniciando index.js...');
console.log('🔑 Tentando logar com token...');
// ===== CONFIGURAÇÃO =====
const config = require('./config.json'); // Opcional, caso tenha configs extras

// ===== EXPRESS KEEP-ALIVE =====
const app = express();
const PORT = process.env.PORT || 3000;

let webOnline = false;
let botOnline = false;

// Rota simples
app.get('/', (req, res) => res.send('🤖 Bot online e servidor web ativo!'));

// Inicia servidor
app.listen(PORT, () => {
  webOnline = true;
  console.log(`🌐 Web server online na porta ${PORT}`);
  checkReady();
});

// ===== CLIENTE DISCORD =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Se quiser lidar com mensagens
  ]
});

// Coleção de comandos
client.commands = new Collection();

// ===== FUNÇÃO PARA CHECAR SE TUDO ESTÁ ONLINE =====
function checkReady() {
  if (webOnline && botOnline) {
    console.log('🎉 Tudo pronto! Servidor e bot online!');
  }
}

// ===== CARREGAR COMANDOS =====
if (fs.existsSync('./commands')) {
  const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      console.log(`✅ Comando carregado: ${command.data.name}`);
    } else {
      console.log(`⚠️ Comando inválido: ${file}`);
    }
  }
}

// ===== CARREGAR EVENTOS =====
if (fs.existsSync('./events')) {
  const eventFiles = fs.readdirSync('./events').filter(f => f.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (typeof event === 'function') {
      event(client);
      console.log(`✅ Evento carregado: ${file}`);
    } else {
      console.log(`⚠️ Evento inválido: ${file}`);
    }
  }
}

// ===== TRATAMENTO DE ERROS =====
process.on('unhandledRejection', (err) => console.error('❌ Erro não tratado:', err));
client.on('error', (err) => console.error('❌ Erro do client:', err));

// ===== LOGIN DO BOT =====
const token = process.env.BOT_TOKEN || config.BOT_TOKEN;

if (!token) {
  console.error('❌ BOT_TOKEN não definido! Configure no .env ou config.json');
  process.exit(1);
}

client.login(token)
  .then(() => {
    console.log('🔑 Tentando logar o bot...');
  })
  .catch(err => console.error('❌ Erro ao logar o bot:', err));

// Evento ready
client.once('ready', () => {
  botOnline = true;
  console.log(`✅ Bot online como ${client.user.tag}`);
  checkReady();
});
