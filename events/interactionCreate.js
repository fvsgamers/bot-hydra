const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionsBitField
} = require('discord.js');

const config = require('../config.json');

const dadosTemp = {};

module.exports = (client) => {
  client.on('interactionCreate', async (interaction) => {

    // comandos
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) await command.execute(interaction);
      return;
    }

    // botão abrir modal
    if (interaction.isButton() && interaction.customId === 'abrir_formulario') {

      const modal = new ModalBuilder()
        .setCustomId('formulario_registro')
        .setTitle('📋 Recrutamento');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('nome')
            .setLabel('Nome e Sobrenome')
            .setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('id')
            .setLabel('ID (somente números)')
            .setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('telefone')
            .setLabel('Telefone')
            .setStyle(TextInputStyle.Short)
        )
      );

      return interaction.showModal(modal);
    }

    // modal enviado
    if (interaction.isModalSubmit() && interaction.customId === 'formulario_registro') {

  try {

    const nome = interaction.fields.getTextInputValue('nome');
    const id = interaction.fields.getTextInputValue('id');
    const telefone = interaction.fields.getTextInputValue('telefone');

    if (!/^\d+$/.test(id)) {
      return interaction.reply({ content: '❌ ID inválido!', flags: 64 });
    }

    // 🔥 MUITO IMPORTANTE
    await interaction.guild.members.fetch();

    const recrutadores = interaction.guild.members.cache.filter(m =>
      config.cargosRecrutadores.some(c => m.roles.cache.has(c))
    );

    const options = recrutadores.map(m => ({
      label: m.displayName,
      value: m.id
    })).slice(0, 25);

    if (options.length === 0) {
      return interaction.reply({
        content: '❌ Nenhum recrutador encontrado!',
        flags: 64
      });
    }

    const selectRecrutador = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`recrutador_${nome}_${id}_${telefone}`)
        .setPlaceholder('Selecione o recrutador')
        .addOptions(options)
    );

    const selectCargo = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`cargo_${nome}_${id}_${telefone}`)
        .setPlaceholder('Selecione o cargo')
        .addOptions([
		  { label: 'Membro', value: '1483886549526515732' },
		  { label: 'Aviãozinho', value: '1483887249476288683' }
		])
    );

    return interaction.reply({
      content: 'Selecione recrutador e cargo:',
      components: [selectRecrutador, selectCargo],
      flags: 64
    });

  } catch (err) {
    console.error('ERRO NO MODAL:', err);

    if (!interaction.replied) {
      interaction.reply({
        content: '❌ Erro ao processar formulário.',
        flags: 64
      });
    }
  }
}

    // dropdowns
    if (interaction.isStringSelectMenu()) {

      const userId = interaction.user.id;

      if (interaction.customId.startsWith('recrutador_')) {
        const [, nome, id, telefone] = interaction.customId.split('_');

        dadosTemp[userId] = {
          nome,
          id,
          telefone,
          recrutador: interaction.values[0]
        };

        return interaction.reply({ content: 'Recrutador selecionado!', flags: 64 });
      }

      if (interaction.customId.startsWith('cargo_')) {

        const dados = dadosTemp[userId];
        dados.cargo = interaction.values[0];

        const canal = await interaction.guild.channels.create({
          name: `📋-${dados.nome}`,
          topic: interaction.user.id,
          type: ChannelType.GuildText,
          parent: config.categoriaTickets,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
              id: interaction.user.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
            },
            {
              id: interaction.client.user.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
            },
            ...config.cargosRecrutadores.map(c => ({
              id: c,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
            }))
          ]
        });

        const embed = new EmbedBuilder()
          .setTitle('📋 Novo Registro')
          .addFields(
            { name: 'Nome', value: dados.nome },
            { name: 'ID', value: dados.id },
            { name: 'Telefone', value: dados.telefone },
            { name: 'Cargo', value: dados.cargo }
          );

        const botoes = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`aprovar_${dados.cargo}`)
            .setLabel('Aprovar')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('reprovar')
            .setLabel('Reprovar')
            .setStyle(ButtonStyle.Danger)
        );

        await canal.send({ embeds: [embed], components: [botoes] });

        delete dadosTemp[userId];

        return interaction.reply({ content: 'Ticket criado!', flags: 64 });
      }
    }

    // aprovar
    if (interaction.isButton() && interaction.customId.startsWith('aprovar')) {

	  const temPermissao = interaction.member.roles.cache.some(role =>
		config.cargosRecrutadores.includes(role.id)
	  );

	  if (!temPermissao) {
		return interaction.reply({
		  content: '❌ Você não tem permissão para aprovar registros.',
		  flags: 64
		});
	  }
		await interaction.deferUpdate();
		const cargoEscolhido = interaction.customId.split('_')[1];
		const membro = interaction.guild.members.cache.get(interaction.channel.topic);

		if (!membro) return;

		// pegar dados da embed
		const mensagem = await interaction.channel.messages.fetch({ limit: 1 });
		const primeiraMsg = mensagem.first();

		let nome = 'Desconhecido';
		let idPlayer = '0000';

		if (primeiraMsg && primeiraMsg.embeds.length > 0) {
		  const embed = primeiraMsg.embeds[0];

		  const campoNome = embed.fields.find(f => f.name.toLowerCase().includes('nome'));
		  const campoId = embed.fields.find(f => f.name.toLowerCase().includes('id'));

		  if (campoNome) nome = campoNome.value;
		  if (campoId) idPlayer = campoId.value;
		}

		// cargos
		await membro.roles.add(config.cargoAprovado);
		await membro.roles.remove(config.cargoRemover);

		if (cargoEscolhido === '1483886549526515732') {
		  await membro.roles.add([
			'1483904316384346233',
			'1483886549526515732'
		  ]);
		}

		if (cargoEscolhido === '1483887249476288683') {
		  await membro.roles.add([
			'1483887249476288683',
			'1483904036720607303'
		  ]);
		}

		// nickname
		let novoNick = '';

		if (cargoEscolhido === '1483886549526515732') {
		  novoNick = `[Membro] ${idPlayer} | ${nome}`;
		}

		if (cargoEscolhido === '1483887249476288683') {
		  novoNick = `[Aviãozinho] ${idPlayer} | ${nome}`;
		}

		try {
		  await membro.setNickname(novoNick);
		} catch (err) {
		  console.error('Erro ao alterar nickname:', err);
		}

		// log
		const log = interaction.guild.channels.cache.get(config.logAprovacoes);
		if (log) {
		  log.send(`✅ ${membro.user.tag} aprovado por ${interaction.user.tag}`);
		}

		await interaction.message.edit({
			content: '✅ Aprovado!',
			components: []
		});

	  setTimeout(() => interaction.channel.delete(), 5000);
	}

    // reprovar
    if (interaction.isButton() && interaction.customId === 'reprovar') {

	  const temPermissao = interaction.member.roles.cache.some(role =>
		config.cargosRecrutadores.includes(role.id)
	  );

	  if (!temPermissao) {
		return interaction.reply({
		  content: '❌ Você não tem permissão para reprovar registros.',
		  flags: 64
		});
	  }

	  await interaction.update({
		content: '❌ Reprovado!',
		components: []
	  });

	  setTimeout(() => interaction.channel.delete(), 5000);
	}

  });
};