// handlers/aiHandler.js
const { Composer, InlineKeyboard } = require('grammy');
const { updateUserCtx, clearHistory } = require('../database');
const { sendMenu, sendTempMessage, showMainMenu } = require('../utils/helpers');
const { vitaMenuKeyboard, backKeyboard } = require('../keyboards/menuKeyboard');

const aiHandler = new Composer();

aiHandler.callbackQuery('main_vita', async (ctx) => {
    const user = ctx.state.user;
    if (!user) return sendMenu(ctx, '❌ Сначала создайте профиль');
    const kb = vitaMenuKeyboard();
    return sendMenu(ctx, '💖 <b>Vita AI – ваш персональный коуч по питанию</b>\n\nВыберите действие:', kb);
});


aiHandler.callbackQuery('vita_start_chat', async (ctx) => {
    const chatId = ctx.chat.id;
    const { createVitaConversation } = require('../database'); 
    const title = `Диалог ${new Date().toLocaleString('ru-RU')}`;
    const convId = createVitaConversation(chatId, title);
    updateUserCtx(ctx, 'current_vita_conv', convId);
    updateUserCtx(ctx, 'step', 'qwen');
    const kb = backKeyboard('main_vita');
    return sendMenu(ctx, '💖 Vita готова помочь. Задай вопрос о питании, привычках, рационе или мотивации.', kb);
});


aiHandler.callbackQuery('vita_history', async (ctx) => {
    const chatId = ctx.chat.id;
    const { getVitaConversations } = require('../database');
    const conversations = getVitaConversations(chatId);
    if (!conversations || conversations.length === 0) {
        return sendMenu(ctx, '📜 <b>История диалогов пуста</b>\n\nНачните общение с Vita через кнопку «Начать диалог».', backKeyboard('main_vita'));
    }

    const text = '📜 <b>Ваши диалоги с Vita</b>\n\nВыберите диалог для просмотра:';
    const kb = new InlineKeyboard();
    for (const conv of conversations) {
        const date = new Date(conv.created_at).toLocaleDateString('ru-RU');
        const title = conv.title || `Диалог от ${date}`;
        kb.text(`${title}`, `view_vita_conv_${conv.id}`).row();
    }
    kb.row().text('🗑 Очистить всю историю', 'clear_history_confirm')
      .row()
      .text('⬅️ Назад', 'main_vita');
    return sendMenu(ctx, text, kb);
});

aiHandler.callbackQuery(/^view_vita_conv_/, async (ctx) => {
    const convId = parseInt(ctx.callbackQuery.data.split('_')[3]);
    const { getVitaMessages } = require('../database');
    const messages = getVitaMessages(convId);
    if (!messages || messages.length === 0) {
        return sendTempMessage(ctx, '❌ Диалог пуст', 3);
    }

    let text = `📖 <b>Диалог #${convId}</b>\n\n`;
    for (const msg of messages) {
        const prefix = msg.role === 'user' ? '👤 Вы' : '🤖 Vita';
        text += `${prefix}: ${msg.content.substring(0, 300)}${msg.content.length > 300 ? '…' : ''}\n\n`;
        if (text.length > 3800) {
            text += '... (сообщений много, сокращено)';
            break;
        }
    }
    const kb = new InlineKeyboard()
        .text('🗑 Удалить этот диалог', `delete_vita_conv_${convId}`)
        .row()
        .text('⬅️ Назад к списку', 'vita_history');
    return sendMenu(ctx, text, kb);
});

aiHandler.callbackQuery(/^delete_vita_conv_/, async (ctx) => {
    const convId = parseInt(ctx.callbackQuery.data.split('_')[3]);
    const { deleteVitaConversation } = require('../database');
    deleteVitaConversation(convId);
    await sendTempMessage(ctx, '✅ Диалог удалён.', 3);
    return aiHandler.callbackQuery('vita_history')(ctx);
});

aiHandler.callbackQuery('clear_history_confirm', async (ctx) => {
    const kb = new InlineKeyboard()
        .text('✅ Да, очистить всё', 'clear_history_do')
        .text('❌ Нет', 'vita_history');
    return sendMenu(ctx, '⚠️ Вы уверены, что хотите удалить ВСЮ историю диалогов с Vita? Это действие необратимо.', kb);
});

aiHandler.callbackQuery('clear_history_do', async (ctx) => {
    const chatId = ctx.chat.id;
    const { deleteAllVitaConversations } = require('../database');
    deleteAllVitaConversations(chatId);
    await sendTempMessage(ctx, '✅ Вся история диалогов очищена.', 3);
    return showMainMenu(ctx);
});

module.exports = aiHandler;