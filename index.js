const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

// Tạo web server nhỏ để Render giữ bot luôn sống
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences, // Đã bật trong code, cần bật cả trên Developer Portal
        GatewayIntentBits.GuildMembers
    ]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ID Discord của bạn (để bot biết khi nào bạn bị ping)
const YOUR_DISCORD_ID = '1332733709501202495';

client.on('ready', () => {
    console.log(`Đã đăng nhập thành công với tên ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Kiểm tra xem bạn có được ping không
    const isMentioned = message.mentions.users.has(YOUR_DISCORD_ID);

    if (isMentioned) {
        const guild = message.guild;
        if (!guild) return; // Bảo vệ đề phòng tin nhắn đến từ DM (Direct Message)

        const targetUser = await guild.members.fetch(YOUR_DISCORD_ID).catch(() => null);

        // LÀM SẠCH VÀ SỬA LỖI TẠI ĐÂY: Kiểm tra presence an toàn để tuyệt đối không bị sập (crash)
        const status = (targetUser && targetUser.presence) ? targetUser.presence.status : 'offline';

        // Nếu bạn offline hoặc invisible
        if (status === 'offline' || status === 'invisible') {
            try {
                await message.channel.sendTyping();

                const prompt = `Bạn là trợ lý AI đại diện cho chủ nhân. Chủ nhân hiện đang vắng mặt/offline.
Người dùng ${message.author.username} vừa hỏi: "${message.content}".
Hãy trả lời lịch sự, tự nhiên, báo rằng chủ nhân đang vắng mặt và hỗ trợ họ giải đáp thắc mắc.`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                await message.reply(response.text());
            } catch (error) {
                console.error("Lỗi AI:", error);
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
