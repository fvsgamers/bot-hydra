module.exports = (client) => {
  client.once('ready', () => {
    console.log(`✅ Bot online como ${client.user.tag}`);
    botOnline = true; // ⚠️ variável do index.js
    checkReady();
  });
};
