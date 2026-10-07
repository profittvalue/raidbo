const { Client, GatewayIntentBits, Partials, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField, ChannelType } = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers], partials: [Partials.Channel] });

const PRODUCTS = [
  {id:"logo_1",label:"1 Logo — $1",category:"Logos",price:"$1"},
  {id:"logo_2",label:"2 Logos — $2",category:"Logos",price:"$2"},
  {id:"logo_4",label:"4 Logos — $5",category:"Logos",price:"$5"},
  {id:"logo_6",label:"6 Logos — $7",category:"Logos",price:"$7"},
  {id:"gang_logo",label:"Gang Logo — $3+",category:"Logos",price:"$3+"},
  {id:"merch_normal",label:"Merch: Normal — $3",category:"Merch",price:"$3"},
  {id:"merch_extra",label:"Merch: Extra Decals/Logos — $5",category:"Merch",price:"$5"},
  {id:"merch_2",label:"Merch: 2 Fits — $6",category:"Merch",price:"$6"},
  {id:"merch_3",label:"Merch: 3 Fits — $9",category:"Merch",price:"$9"},
  {id:"merch_4",label:"Merch: 4 Fits — $12",category:"Merch",price:"$12"},
  {id:"merch_5",label:"Merch: 5 Fits — $15",category:"Merch",price:"$15"},
  {id:"wrap_1",label:"Car Wrap: 1 Decal — $1",category:"Car Wraps",price:"$1"},
  {id:"wrap_3",label:"Car Wrap: 3 Decals — $2",category:"Car Wraps",price:"$2"},
  {id:"wrap_6",label:"Car Wrap: 6 Decals — $4",category:"Car Wraps",price:"$4"},
  {id:"wrap_logo",label:"Car Wrap: Logo Made By Me — $1",category:"Car Wraps",price:"$1"}
];
const PAYMENTS=["Cash App","PayPal","Zelle"];

function shopEmbed(){return new EmbedBuilder().setTitle("🛒 RAID BOT SHOP").setDescription("Welcome to the Raid Bot Shop!\n\nSelect a product below to view the price and begin your order. After choosing your product, select a payment method and create your purchase ticket.").setFooter({text:"Raid Bot • Purchase System"});}
function productMenu(){return new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("raid_product").setPlaceholder("Select a product").addOptions(PRODUCTS.map(p=>new StringSelectMenuOptionBuilder().setLabel(p.label).setValue(p.id).setDescription(p.category+" • "+p.price))));}

client.once("ready",()=>console.log(`Raid Bot online as ${client.user.tag}`));

client.on("interactionCreate",async i=>{
 try{
  if(i.isChatInputCommand()){
   if(i.commandName==="shop") return i.reply({embeds:[shopEmbed()],components:[productMenu()]});
   if(i.commandName==="setup-shop"){
    if(!i.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild)) return i.reply({content:"❌ You need Manage Server.",ephemeral:true});
    await i.channel.send({embeds:[shopEmbed()],components:[productMenu()]});
    return i.reply({content:"✅ Raid Bot shop panel posted.",ephemeral:true});
   }
  }
  if(i.isStringSelectMenu() && i.customId==="raid_product"){
   const p=PRODUCTS.find(x=>x.id===i.values[0]); if(!p)return i.reply({content:"❌ Product not found.",ephemeral:true});
   const menu=new StringSelectMenuBuilder().setCustomId("raid_payment:"+p.id).setPlaceholder("Select a payment method").addOptions(PAYMENTS.map(x=>new StringSelectMenuOptionBuilder().setLabel(x).setValue(x.toLowerCase().replace(" ","_"))));
   return i.reply({embeds:[new EmbedBuilder().setTitle("💳 Choose Payment Method").setDescription(`**Product:** ${p.label}\n**Price:** ${p.price}\n\nChoose how you will pay.`)],components:[new ActionRowBuilder().addComponents(menu)],ephemeral:true});
  }
  if(i.isStringSelectMenu() && i.customId.startsWith("raid_payment:")){
   const p=PRODUCTS.find(x=>x.id===i.customId.split(":")[1]); const pay=i.values[0].replace("_"," "); if(!p)return i.reply({content:"❌ Product not found.",ephemeral:true});
   return i.update({embeds:[new EmbedBuilder().setTitle("🧾 Order Summary").setDescription(`**Product:** ${p.label}\n**Category:** ${p.category}\n**Price:** ${p.price}\n**Payment:** ${pay}\n\nClick below to create your purchase ticket.`)],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`raid_ticket:${p.id}:${pay}`).setLabel("🎫 Create Purchase Ticket").setStyle(ButtonStyle.Success))]});
  }
  if(i.isButton() && i.customId.startsWith("raid_ticket:")){
   const [,pid,pay]=i.customId.split(":"); const p=PRODUCTS.find(x=>x.id===pid); if(!p)return i.reply({content:"❌ Product not found.",ephemeral:true});
   const g=i.guild; const existing=g.channels.cache.find(c=>c.type===ChannelType.GuildText&&c.topic===`raid-order:${i.user.id}`);
   if(existing)return i.reply({content:`❌ You already have an open ticket: ${existing}`,ephemeral:true});
   const safe=(i.user.username.toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,18)||"customer");
   const t=await g.channels.create({name:`order-${safe}`,type:ChannelType.GuildText,topic:`raid-order:${i.user.id}`,permissionOverwrites:[{id:g.roles.everyone.id,deny:[PermissionsBitField.Flags.ViewChannel]},{id:i.user.id,allow:[PermissionsBitField.Flags.ViewChannel,PermissionsBitField.Flags.SendMessages,PermissionsBitField.Flags.ReadMessageHistory,PermissionsBitField.Flags.AttachFiles]}]});
   if(process.env.STAFF_ROLE_ID) await t.permissionOverwrites.create(process.env.STAFF_ROLE_ID,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true,AttachFiles:true}).catch(()=>{});
   await t.send({content:process.env.STAFF_ROLE_ID?`<@&${process.env.STAFF_ROLE_ID}> <@${i.user.id}>`:`<@${i.user.id}>`,embeds:[new EmbedBuilder().setTitle("🎫 Raid Bot Purchase").setDescription(`Welcome <@${i.user.id}>!\n\n**Product:** ${p.label}\n**Price:** ${p.price}\n**Payment:** ${pay}\n\nPlease provide any details/files the seller needs.`)]});
   return i.reply({content:`✅ Your ticket is ready: ${t}`,ephemeral:true});
  }
 }catch(e){console.error(e);if(!i.replied&&!i.deferred)await i.reply({content:"❌ Something went wrong. Check Railway logs.",ephemeral:true}).catch(()=>{});}
});
client.login(process.env.DISCORD_TOKEN);