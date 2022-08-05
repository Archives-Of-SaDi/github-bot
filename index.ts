import {
  Bot,
  InlineKeyboard,
  webhookCallback,
} from 'https://deno.land/x/grammy@v1.10.1/mod.ts';
import axiod from 'https://deno.land/x/axiod@0.26.1/mod.ts';
import { serve } from 'https://deno.land/x/sift@0.5.0/mod.ts';
import 'https://deno.land/x/dotenv@v3.2.0/load.ts';

if (
  !Deno.env.get('BOT_TOKEN') ||
  !Deno.env.get('WEBHOOK_URL') ||
  !Deno.env.get('MODE')
) {
  console.log('Environment variables not set, please see .env.example');
  Deno.exit(1);
}

const bot = new Bot(Deno.env.get('BOT_TOKEN')!);
const handleUpdate = webhookCallback(bot, 'std/http');

bot.on(
  'message',
  (ctx) =>
    ctx.reply(`Type\n<code>@${bot.botInfo.username} username</code>`, {
      parse_mode: 'HTML',
    }),
);

bot.inlineQuery(/.+/, async (ctx) => {
  const API = `https://api.github.com/users/${ctx.inlineQuery.query}`;

  try {
    const { data } = await axiod.get(API);

    await ctx.answerInlineQuery(
      [
        {
          type: 'photo',
          id: data.id,
          photo_url: data.avatar_url,
          thumb_url: data.avatar_url,
          photo_file_id: data.avatar_url,
          title: data.name,
          description: data.bio,
          url: data.html_url,
          caption: `Name: ${data.name}` +
            `\n` +
            `Username: ${data.login}` +
            `\n` +
            `Bio: ${data.bio || 'Not Given'}` +
            `\n` +
            `Public Repos: ${data.public_repos}` +
            `\n` +
            `Followers: ${data.followers}` +
            `\n` +
            `Following: ${data.following}` +
            `\n` +
            `Location: ${data.location}` +
            `\n` +
            `Company: ${data.company || 'Not Given'}` +
            `\n` +
            `Blog: ${data.blog || 'Not Given'}` +
            `\n` +
            `Email: ${data.email || 'Not Given'}` +
            `\n`,
          reply_markup: new InlineKeyboard().url(
            'View on GitHub',
            data.html_url,
          ),
        },
      ],
      { cache_time: 10 },
    );
    // deno-lint-ignore no-unused-vars
  } catch (e) {
    await ctx.answerInlineQuery(
      [
        {
          type: 'article',
          id: '1',
          title: 'User not found',
          input_message_content: {
            message_text: 'User not found',
          },
        },
      ],
      { cache_time: 10 },
    );
  }
});

serve({
  ['/' + Deno.env.get('BOT_TOKEN')]: async (req) => {
    if (req.method == 'POST') {
      try {
        return await handleUpdate(req);
      } catch (err) {
        console.error(err);
      }
    }
    return new Response();
  },
  '/': () => {
    return new Response('Hello world!');
  },
});

Deno.env.get('MODE') === 'development' && bot.start();
Deno.env.get('MODE') === 'production' &&
  bot.api.setWebhook(
    Deno.env.get('WEBHOOK_URL')! + '/' + Deno.env.get('BOT_TOKEN')!,
  );
