const { Composer, InlineKeyboard } = require('grammy');
const { updateUserCtx, resetProfile } = require('../database');
const { sendMenu, sendTempMessage, updateCalculations, recommendDiet, showMainMenu, getDietLabel, escapeHtml } = require('../utils/helpers');
const {
    profileManagementKeyboard,
    editParamsKeyboard,
    genderKeyboard,
    activityKeyboard,
    goalKeyboard,
    deleteConfirmKeyboard,
    startCalcKeyboard,
    mainMenuKeyboard
} = require('../keyboards/menuKeyboard');

const profileHandler = new Composer();

profileHandler.callbackQuery('main_profile', async (ctx) => {
    await ctx.answerCallbackQuery();
    const kb = profileManagementKeyboard();
    return sendMenu(ctx, '⚙️ <b>Управление профилем</b>\n\nВыберите действие:', kb);
});

profileHandler.callbackQuery('profile_change_params', async (ctx) => {
    await ctx.answerCallbackQuery();
    await updateUserCtx(ctx, 'step', 'edit_params_menu');
    const kb = editParamsKeyboard();
    return sendMenu(ctx, '✏️ <b>Редактирование параметров</b>\n\nВыберите, что хотите изменить:', kb);
});

profileHandler.callbackQuery('profile_change_diet', async (ctx) => {
    await ctx.answerCallbackQuery();
    const user = ctx.state.user;
    const rec = recommendDiet(user);
    const diets = [
        { id: 'balanced', label: '⚖️ Сбалансированная' },
        { id: 'lowcarb', label: '🥩 Низкоуглеводная' },
        { id: 'keto', label: '🥑 Кето' },
        { id: 'vegetarian', label: '🌿 Вегетарианская' },
        { id: 'mediterranean', label: '🌊 Средиземноморская' }
    ];
    const kb = new InlineKeyboard();
    for (let i = 0; i < diets.length; i++) {
        let label = diets[i].label;
        if (diets[i].id === rec.diet) label = '⭐ ' + label;
        kb.text(label, `edit_diet_${diets[i].id}`);
        if (i % 2 === 1) kb.row();
    }
    kb.row().text('⬅️ Назад', 'back_to_profile_management');
    const fullText = `<b>${rec.text}</b>\n\nВыберите новый тип питания:`;
    return sendMenu(ctx, fullText, kb);
});

profileHandler.callbackQuery(/^edit_diet_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const diet = ctx.callbackQuery.data.replace('edit_diet_', '');
    await updateUserCtx(ctx, 'diet_type', diet);
    await updateCalculations(ctx.chat.id);
    await sendTempMessage(ctx, '✅ Диета успешно изменена!', 3);
    const user = ctx.state.user;
    const goalText = { lose: '📉 Похудение', maintain: '⚖️ Поддержание', gain: '💪 Набор массы' }[user.goal] || user.goal;
    const weightDisplay = user.target_weight ? `${user.weight} кг → ${user.target_weight} кг` : `${user.weight} кг`;
    const waterCurrent = user.water_today ?? 0;
    const waterTarget = user.water_target ?? 0;
    const dietLabel = getDietLabel(user.diet_type);
    const card = `👤 <b>${escapeHtml(user.name || 'Пользователь')}</b>\n\n🎯 Цель: ${goalText}\n⚖️ Вес: ${weightDisplay}\n🔥 Норма: ${user.calories} ккал\n🍽 Диета: ${dietLabel}\n\n🍗 Белки: ${user.protein} г\n🥑 Жиры: ${user.fat} г\n🍞 Углеводы: ${user.carbs} г\n\n💧 Вода: ${waterCurrent} / ${waterTarget} мл`.trim();
    const kb = mainMenuKeyboard();
    return sendMenu(ctx, card, kb);
});

profileHandler.callbackQuery('profile_delete', async (ctx) => {
    await ctx.answerCallbackQuery();
    const kb = deleteConfirmKeyboard();
    return sendMenu(ctx, '⚠️ <b>Внимание!</b>\nВсе ваши данные будут удалены без возможности восстановления.\n\nВы уверены?', kb);
});

profileHandler.callbackQuery('profile_delete_confirm', async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat.id;
    resetProfile(chatId);
    await updateUserCtx(ctx, 'step', 'name');
    const kb = startCalcKeyboard();
    return sendMenu(ctx, '👋 Профиль удалён. Чтобы начать сначала, нажмите кнопку ниже.', kb);
});

profileHandler.callbackQuery('profile_back', async (ctx) => {
    await ctx.answerCallbackQuery();
    await updateUserCtx(ctx, 'step', null);
    return showMainMenu(ctx);
});

profileHandler.callbackQuery('back_to_profile_management', async (ctx) => {
    await ctx.answerCallbackQuery();
    await updateUserCtx(ctx, 'step', null);
    const kb = profileManagementKeyboard();
    return sendMenu(ctx, '⚙️ <b>Управление профилем</b>\n\nВыберите действие:', kb);
});

profileHandler.callbackQuery('param_name', async (ctx) => {
    await ctx.answerCallbackQuery();
    await updateUserCtx(ctx, 'step', 'edit_param_name');
    return sendMenu(ctx, 'Введите новое имя:');
});

profileHandler.callbackQuery('param_gender', async (ctx) => {
    await ctx.answerCallbackQuery();
    await updateUserCtx(ctx, 'step', null);
    const kb = genderKeyboard('edit_gender');
    return sendMenu(ctx, 'Выберите пол:', kb);
});

profileHandler.callbackQuery('param_age', async (ctx) => {
    await ctx.answerCallbackQuery();
    await updateUserCtx(ctx, 'step', 'edit_param_age');
    return sendMenu(ctx, 'Введите возраст (лет):');
});

profileHandler.callbackQuery('param_height', async (ctx) => {
    await ctx.answerCallbackQuery();
    await updateUserCtx(ctx, 'step', 'edit_param_height');
    return sendMenu(ctx, 'Введите рост (см):');
});

profileHandler.callbackQuery('param_weight', async (ctx) => {
    await ctx.answerCallbackQuery();
    await updateUserCtx(ctx, 'step', 'edit_param_weight');
    return sendMenu(ctx, 'Введите вес (кг):');
});

profileHandler.callbackQuery('param_target_weight', async (ctx) => {
    await ctx.answerCallbackQuery();
    await updateUserCtx(ctx, 'step', 'edit_param_target_weight');
    return sendMenu(ctx, 'Введите целевой вес (кг):');
});

profileHandler.callbackQuery('param_activity', async (ctx) => {
    await ctx.answerCallbackQuery();
    await updateUserCtx(ctx, 'step', null);
    const kb = activityKeyboard('edit_activity');
    return sendMenu(ctx, 'Выберите уровень активности:', kb);
});

profileHandler.callbackQuery('param_goal', async (ctx) => {
    await ctx.answerCallbackQuery();
    await updateUserCtx(ctx, 'step', null);
    const kb = goalKeyboard('edit_goal');
    return sendMenu(ctx, 'Выберите цель:', kb);
});

profileHandler.callbackQuery(/^edit_gender_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const gender = ctx.callbackQuery.data.split('_')[2];
    await updateUserCtx(ctx, 'gender', gender);
    await updateCalculations(ctx.chat.id);
    await updateUserCtx(ctx, 'step', 'edit_params_menu');
    await sendTempMessage(ctx, '✅ Пол изменён', 2);
    const kb = editParamsKeyboard();
    return sendMenu(ctx, '✏️ <b>Редактирование параметров</b>\n\nВыберите, что хотите изменить:', kb);
});

profileHandler.callbackQuery(/^edit_activity_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const activity = ctx.callbackQuery.data.split('_')[2];
    await updateUserCtx(ctx, 'activity', activity);
    await updateCalculations(ctx.chat.id);
    await updateUserCtx(ctx, 'step', 'edit_params_menu');
    await sendTempMessage(ctx, '✅ Активность изменена', 2);
    const kb = editParamsKeyboard();
    return sendMenu(ctx, '✏️ <b>Редактирование параметров</b>\n\nВыберите, что хотите изменить:', kb);
});

profileHandler.callbackQuery(/^edit_goal_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const goal = ctx.callbackQuery.data.split('_')[2];
    await updateUserCtx(ctx, 'goal', goal);
    await updateCalculations(ctx.chat.id);
    await updateUserCtx(ctx, 'step', 'edit_params_menu');
    await sendTempMessage(ctx, '✅ Цель изменена', 2);
    const kb = editParamsKeyboard();
    return sendMenu(ctx, '✏️ <b>Редактирование параметров</b>\n\nВыберите, что хотите изменить:', kb);
});

module.exports = profileHandler;