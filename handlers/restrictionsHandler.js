const { Composer, InlineKeyboard } = require('grammy');
const { updateUserCtx } = require('../database');
const { sendMenu, sendTempMessage, showMainMenu } = require('../utils/helpers');

const restrictionsHandler = new Composer();

const availableRestrictions = [
    { id: 'gluten', name: '🚫 Без глютена', emoji: '🌾' },
    { id: 'lactose', name: '🚫 Без лактозы', emoji: '🥛' },
    { id: 'nuts', name: '🚫 Без орехов', emoji: '🥜' },
    { id: 'chicken', name: '🚫 Без курицы', emoji: '🐔' },
    { id: 'fish', name: '🚫 Без рыбы', emoji: '🐟' },
    { id: 'seafood', name: '🚫 Без морепродуктов', emoji: '🦐' },
    { id: 'pork', name: '🚫 Без свинины', emoji: '🐷' },
    { id: 'beef', name: '🚫 Без говядины', emoji: '🐮' },
    { id: 'eggs', name: '🚫 Без яиц', emoji: '🥚' },
    { id: 'soy', name: '🚫 Без сои', emoji: '🫘' }
];

function getRestrictionsKeyboard(currentRestrictions) {
    const kb = new InlineKeyboard();
    for (const r of availableRestrictions) {
        const isActive = currentRestrictions.includes(r.id);
        const label = `${isActive ? '✅' : '❌'} ${r.name}`;
        kb.text(label, `toggle_restriction_${r.id}`).row();
    }
    kb.row().text('💾 Сохранить', 'save_restrictions')
      .text('⬅️ Назад', 'profile_back');
    return kb;
}

restrictionsHandler.callbackQuery('edit_restrictions', async (ctx) => {
    const user = ctx.state.user;
    let currentRestrictions = [];
    if (user.restrictions) {
        try {
            currentRestrictions = JSON.parse(user.restrictions);
        } catch(e) {}
    }
    const kb = getRestrictionsKeyboard(currentRestrictions);
    return sendMenu(ctx, '⚙️ <b>Настройки питания</b>\n\nВыберите продукты, которые нужно исключить из рациона:', kb);
});

restrictionsHandler.callbackQuery(/^toggle_restriction_/, async (ctx) => {
    const restrictionId = ctx.callbackQuery.data.replace('toggle_restriction_', '');
    const user = ctx.state.user;
    let restrictions = [];
    if (user.restrictions) {
        try {
            restrictions = JSON.parse(user.restrictions);
        } catch(e) {}
    }
    
    if (restrictions.includes(restrictionId)) {
        restrictions = restrictions.filter(r => r !== restrictionId);
    } else {
        restrictions.push(restrictionId);
    }
    
    updateUserCtx(ctx, 'restrictions', JSON.stringify(restrictions));
    
    const kb = getRestrictionsKeyboard(restrictions);
    await sendTempMessage(ctx, `✅ ${restrictionId === 'gluten' ? 'Глютен' : restrictionId === 'lactose' ? 'Лактоза' : restrictionId} ${restrictions.includes(restrictionId) ? 'добавлен в исключения' : 'удалён из исключений'}`, 2);
    return sendMenu(ctx, '⚙️ <b>Настройки питания</b>\n\nВыберите продукты, которые нужно исключить из рациона:', kb);
});

restrictionsHandler.callbackQuery('save_restrictions', async (ctx) => {
    await sendTempMessage(ctx, '✅ Настройки сохранены! При следующем создании рациона они будут учтены.', 3);
    return showMainMenu(ctx);
});

module.exports = restrictionsHandler;