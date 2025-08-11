# Whatsapp Rem Bot

Bot de WhatsApp rodando no Termux com suporte a:
- Figurinhas estáticas (`!fig`)
- Figurinhas animadas (`!figgif`)
- Piadas (`!piada`)
- Clima (`!clima <cidade>`)
- Baixar áudio do YouTube (`!yt <link>`)

## 📲 Como instalar no Termux
```bash
pkg update && pkg upgrade -y
pkg install git nodejs ffmpeg -y
git clone https://github.com/SEU_USUARIO/Whatsapp-Rem-Bot-.git
cd Whatsapp-Rem-Bot-
npm install
node index.js
