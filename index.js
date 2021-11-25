const { Client, Intents, MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu } = require('discord.js'),
client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ] }),
fs = require('fs');

const config = {
        token: "",//your bot token,
        prefix: "/",
        adminID: "767726828311543820",//admin id,
        embed_color: "#ffffff"
    };

const _colors = [
    { name: `Red`, hex: `#EF9A9A` },
    { name: `Pink`, hex: `#F48FB1` },
    { name: `Purple`, hex: `#CE93D8` },
    { name: `Deep Purple`, hex: `#B39DDB` },
    { name: `Indigo`, hex: `#9FA8DA` },
    { name: `Blue`, hex: `#90CAF9` },
    { name: `Light Blue`, hex: `#81D4FA` },
    { name: `Cyan`, hex: `#80DEEA` },
    { name: `Teal`, hex: `#80CBC4` },
    { name: `Green`, hex: `#A5D6A7` },
    { name: `Light Green`, hex: `#C5E1A5` },
    { name: `Lime`, hex: `#E6EE9C` },
    { name: `Yellow`, hex: `#FFF59D` },
    { name: `Amber`, hex: `#FFE082` },
    { name: `Orange`, hex: `#FFCC80` },
    { name: `Deep Orange`, hex: `#FFAB91` },
    { name: `Brown`, hex: `#8a5a4c` }
];
var colors = _colors;

client.login(config.token);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    importColorsJSON();
});


client.on('messageCreate', async (message) => {

    if (!message.content.startsWith(config.prefix)) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift();

    if (message.author.id == config.adminID) {
        if (command == "createroles") {
            for (i = 0; i < colors.length; i++) {
                if (colors[i].role != undefined) {
                    const role = await message.guild.roles.fetch(colors[i].role);
                    role.delete();
                }
                const _role = await message.guild.roles.create({
                    name: `${colors[i].name}`,
                    color: `${colors[i].hex}`,
                    reason: `Color ${colors[i].name}`
                });
                colors[i].role = _role.id;
            }
            fs.writeFile('colors.json', JSON.stringify(colors, null, 2), (err) => {
                if (err) throw err;
            });
            message.reply(`colors.json \`\`\`json\n${JSON.stringify(colors, null, 2)}\`\`\``);
        }

        if (command == "deleteroles") {
            for (i = 0; i < colors.length; i++) {
                if (colors[i].role != undefined) {
                    const role = await message.guild.roles.fetch(colors[i].role);
                    role.delete();
                }
                colors[i].role = undefined;
            }
            fs.writeFile('colors.json', JSON.stringify(colors, null, 2), (err) => {
                if (err) throw err;
            });
            message.reply(`colors.json \`\`\`json\n${JSON.stringify(colors, null, 2)}\`\`\``);
        }

        if (command == "publicembedbuttons") {
            let description = `You can choose your role here:\n`, 
                components = [], 
                lastComponent = new MessageActionRow();
            for (let i = 0; i < colors.length; i++) {
                // embed's description
                if (colors[i].role != undefined) {
                    const role = await message.guild.roles.fetch(colors[i].role);
                    description += `\n${role} - ${colors[i].name}`;
                }
                // button
                const button = new MessageButton()
                    .setLabel(`${colors[i].name}`)
                    .setStyle(`SECONDARY`)
                    .setCustomId(`button_color_${i}`);
                lastComponent.addComponents(button);
                if (lastComponent.components.length == 5) {
                    components.push(lastComponent);
                    lastComponent = new MessageActionRow(); 
                }
            }
            if (components.length < 5) components.push(lastComponent);
            const embed = new MessageEmbed()
                .setColor(config.embed_color)
                .setTitle(`Shoose color`)
                .setDescription(description);
            message.channel.send({
                embeds: [embed],
                components: components
            })
        }

        if (command == "publicembedselectmenu") {
            let description = `You can choose your role here:\n`,
                options = [];
            for (let i = 0; i < colors.length; i++) {
                // embed's description
                if (colors[i].role != undefined) {
                    const role = await message.guild.roles.fetch(colors[i].role);
                    description += `\n${role} - ${colors[i].name}`;
                }
                // menu option
                options.push({
                    label: `${colors[i].name}`,
                    value: `${i}`
                });
            }
            const selectMenu = new MessageSelectMenu()
                .setCustomId(`select_color`)
                .setPlaceholder(`Choose a color`)
                .addOptions(options)
                .setMaxValues(1);
            const menu = new MessageActionRow()
                .addComponents(selectMenu);
            
            const embed = new MessageEmbed()
                .setColor(config.embed_color)
                .setTitle(`Shoose color`)
                .setDescription(description);
            message.channel.send({
                embeds: [embed],
                components: [menu]
            })
        }


    }
});


client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) { // `button_color_${i}`
        if (interaction.customId.includes(`button_color_`)) {
            const roleIndex = parseInt(interaction.customId.replace(`button_color_`, ``).trim());

            const colorsImported = await checkColorsJSON(roleIndex);
            if (!colorsImported) return interaction.reply({ content: `Error` });

            const member = await interaction.guild.members.fetch(interaction.user.id);
            await removeColorsRoles(member, roleIndex);
            const role = await interaction.guild.roles.fetch(colors[roleIndex].role);
            if (member.roles.cache.some(r => [colors[roleIndex].role].includes(r.id))) {
                member.roles.remove(role);
                interaction.reply({
                    content: `${role} lost`,
                    ephemeral: true
                })
            } else {
                member.roles.add(role);
                interaction.reply({
                    content: `${role} received`,
                    ephemeral: true
                })
            }
        }
    }
    if (interaction.isSelectMenu()) { // `select_color`
        if (interaction.customId == `select_color`) {
            const roleIndex = parseInt(interaction.values[0]);

            const colorsImported = await checkColorsJSON(roleIndex);
            if (!colorsImported) return interaction.reply({ content: `Error` });

            const member = await interaction.guild.members.fetch(interaction.user.id);
            await removeColorsRoles(member, roleIndex);
            const role = await interaction.guild.roles.fetch(colors[roleIndex].role);
            if (member.roles.cache.some(r => [colors[roleIndex].role].includes(r.id))) {
                member.roles.remove(role);
                interaction.reply({
                    content: `${role} lost`,
                    ephemeral: true
                })
            } else {
                member.roles.add(role);
                interaction.reply({
                    content: `${role} received`,
                    ephemeral: true
                })
            }
        }
    }
});

function checkColorsJSON(index = 0) {
    return new Promise(async (resolve, reject) => {
        if (Array.isArray(colors) && colors.length && index < colors.length && colors[index].role != undefined) {
            resolve(true);
        } else {
            await importColorsJSON();
            if (!Array.isArray(colors) || !colors.length || index > colors.length || colors[index].role == undefined) {
                colors = _colors;
                resolve(false);
            } else {
                resolve(true);
            }
        }
    });
}

function importColorsJSON() {
    return new Promise((resolve, reject) => {
        try {
            if (fs.existsSync(`./colors.json`)) {
                colors = require(`./colors.json`);
                resolve(true);
            }
        } catch (err) {
            // do nothing
        }
        resolve(false);
    });
}

function removeColorsRoles(member, roleIndex = -1) {
    return new Promise(async (resolve, reject) => {
        if (member == undefined) resolve();
        
        for (let i = 0; i < colors.length; i++) {
            if (roleIndex == i) continue;
            const role = await member.guild.roles.fetch(colors[i].role);
            if (member.roles.cache.some(r => [colors[i].role].includes(r.id))) {
                member.roles.remove(role);
            }
        }
        resolve();
    });
}