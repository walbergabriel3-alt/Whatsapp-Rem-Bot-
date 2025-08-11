const makeWASocket = require('@whiskeysockets/baileys').default;
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const fs = require('fs');
const axios = require('axios');
const ytdl = require('ytdl-core');
const moment = require('moment');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

async function startBot() {
    const sock = makeWASocket({ printQRInTerminal: true });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || !msg.key.remoteJid) return;

        const from = msg.key.remoteJid;
        const type = Object.keys(msg.message)[0];
        const texto = type === 'conversation' ? msg.message.conversation :
                      type === 'extendedTextMessage' ? msg.message.extendedTextMessage.text : '';

        // !fig -> figurinha estática
        if (msg.message.imageMessage && texto.toLowerCase() === '!fig') {
            const buffer = await sock.downloadMediaMessage(msg);
            const sticker = new Sticker(buffer, { pack: 'RemBot', author: 'Termux', type: StickerTypes.FULL });
            await sock.sendMessage(from, await sticker.build(), { quoted: msg });
        }

        // !figgif -> figurinha animada
        if ((msg.message.videoMessage || msg.message.imageMessage) && texto.toLowerCase() === '!figgif') {
            const buffer = await sock.downloadMediaMessage(msg);
            fs.writeFileSync('in.mp4', buffer);

            await new Promise((resolve, reject) => {
                ffmpeg('in.mp4')
                    .outputOptions([
                        '-vcodec', 'libwebp',
                        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0',
                        '-loop', '0'
                    ])
                    .save('out.webp')
                    .on('end', resolve)
                    .on('error', reject);
            });

            await sock.sendMessage(from, { sticker: fs.readFileSync('out.webp') }, { quoted: msg });
            fs.unlinkSync('in.mp4');
            fs.unlinkSync('out.webp');
        }

        // !piada
        if (texto.toLowerCase() === '!piada') {
            const res = await axios.get('https://v2.jokeapi.dev/joke/Any?lang=pt');
            const piada = res.data.type === 'single'
                ? res.data.joke
                : `${res.data.setup}\n${res.data.delivery}`;
            await sock.sendMessage(from, { text: piada }, { quoted: msg });
        }

        // !clima
        if (texto.startsWith('!clima ')) {
            const cidade = texto.replace('!clima ', '');
            try {
                const apiKey = 'SUA_API_OPENWEATHER'; // Coloque sua chave aqui
                const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`);
                const d = res.data;
                const climaMsg = `🌤 Clima em *${d.name}*:
🌡 Temp: ${d.main.temp}°C
💧 Umidade: ${d.main.humidity}%
🌬 Vento: ${d.wind.speed} m/s
📅 Atualizado: ${moment.unix(d.dt).format('DD/MM/YYYY HH:mm')}`;
                await sock.sendMessage(from, { text: climaMsg }, { quoted: msg });
            } catch {
                await sock.sendMessage(from, { text: '❌ Cidade não encontrada.' }, { quoted: msg });
            }
        }

        // !yt
        if (texto.startsWith('!yt ')) {
            const url = texto.replace('!yt ', '');
            if (!ytdl.validateURL(url)) {
                await sock.sendMessage(from, { text: '❌ URL inválida.' }, { quoted: msg });
                return;
            }

            await sock.sendMessage(from, { text: '⏳ Baixando áudio...' }, { quoted: msg });
            const audioPath = './audio.mp3';
            ytdl(url, { filter: 'audioonly' })
                .pipe(fs.createWriteStream(audioPath))
                .on('finish', async () => {
                    await sock.sendMessage(from, { audio: fs.readFileSync(audioPath), mimetype: 'audio/mp4' }, { quoted: msg });
                    fs.unlinkSync(audioPath);
                });
        }
    });
}

startBot();
