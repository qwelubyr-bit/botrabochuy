const { InlineKeyboard } = require('grammy');
const { getUser, updateUser, createUser } = require('../database');
const { calculateGoal } = require('../calculator');

async function safeDelete(ctx, id) {
    try { await ctx.api.deleteMessage(ctx.chat.id, id); } catch {}
}

async function deleteUserMessage(ctx) {
    try {
        if (ctx.message?.message_id) {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
        }
    } catch {}
}

async function sendMenu(ctx, text, kb) {
    const user = ctx.state.user || getUser(ctx.chat.id);
    if (user?.menu_id) {
        try { await ctx.api.deleteMessage(ctx.chat.id, user.menu_id); } catch {}
    }
    const msg = await ctx.reply(text, { reply_markup: kb, parse_mode: 'HTML' });
    if (user) {
        updateUser(ctx.chat.id, 'menu_id', msg.message_id);
        if (ctx.state.user) ctx.state.user.menu_id = msg.message_id;
    }
    return msg;
}

async function sendTempMessage(ctx, text, seconds = 10) {
    const msg = await ctx.reply(text);
    setTimeout(async () => {
        try { await ctx.api.deleteMessage(ctx.chat.id, msg.message_id); } catch {}
    }, seconds * 1000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, (m) => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function updateCalculations(chatId) {
    const user = getUser(chatId);
    if (!user || !user.goal || !user.weight || !user.height || !user.age) return false;
    const diet = user.diet_type || 'balanced';
    const result = calculateGoal(user, user.goal, diet);
    if (!result) return false;
    updateUser(chatId, 'calories', result.calories);
    updateUser(chatId, 'protein', result.protein);
    updateUser(chatId, 'fat', result.fat);
    updateUser(chatId, 'carbs', result.carbs);
    updateUser(chatId, 'water_target', result.waterTarget);
    updateUser(chatId, 'bmr', result.bmr);
    updateUser(chatId, 'tdee', result.tdee);
    updateUser(chatId, 'activity_factor', result.activity);
    updateUser(chatId, 'goal_factor', user.goal === 'lose' ? 0.85 : (user.goal === 'gain' ? 1.15 : 1));
    return true;
}

function getDietLabel(dietType) {
    const labels = {
        'balanced': '⚖️ Сбалансированная',
        'lowcarb': '🥩 Низкоуглеводная',
        'keto': '🥑 Кето',
        'vegetarian': '🌿 Вегетарианская',
        'mediterranean': '🌊 Средиземноморская'
    };
    return labels[dietType] || '❓ Не выбрана';
}

function recommendDiet(user) {
    const bmi = user.weight / ((user.height / 100) ** 2);
    const { goal, age, gender, activity } = user;
    if (goal === 'lose') {
        if (bmi > 35) return { diet: 'lowcarb', text: '📉 При высоком ИМТ (>35) низкоуглеводная диета показывает лучшие результаты.' };
        if (age > 50) return { diet: 'mediterranean', text: '❤️ Средиземноморская диета полезна для сердца и сосудов, особенно после 50 лет.' };
        if (gender === 'female' && bmi > 28) return { diet: 'balanced', text: '⚖️ Сбалансированная диета – безопасный выбор для женщин с умеренным лишним весом.' };
        return { diet: 'balanced', text: '🥗 Сбалансированное питание – надёжный фундамент для похудения.' };
    } else if (goal === 'gain') {
        if (activity === 'high' || activity === 'athlete') return { diet: 'mediterranean', text: '💪 При высокой активности средиземноморская диета даст энергию и здоровые жиры.' };
        return { diet: 'balanced', text: '🍽️ Для комфортного набора массы подойдёт сбалансированный рацион.' };
    } else {
        if (age > 45 || (gender === 'female' && age > 40)) return { diet: 'mediterranean', text: '🌊 Средиземноморская диета – лучший выбор для долголетия и здоровья сердца.' };
        return { diet: 'balanced', text: '✅ Сбалансированная диета поможет сохранить форму и здоровье.' };
    }
}

async function showMainMenu(ctx) {
    const chatId = ctx.chat.id;
    let user = ctx.state.user || getUser(chatId);
    if (!user) {
        createUser(chatId);
        user = getUser(chatId);
        ctx.state.user = user;
    }
    const hasProfile = user && user.goal && user.calories;
    if (!hasProfile) {
        const { startCalcKeyboard } = require('../keyboards/menuKeyboard');
        const kb = startCalcKeyboard();
        return sendMenu(ctx, '👋 Добро пожаловать! Нажмите кнопку ниже, чтобы рассчитать диету.', kb);
    }

    const { getWaterForDate, getActivePlan } = require('../foodDB');
    const today = new Date().toISOString().slice(0, 10);
    const waterCurrent = getWaterForDate(chatId, today);
    const waterTarget = user.water_target ?? 0;

    const goalText = { 'lose': '📉 Похудение', 'maintain': '⚖️ Поддержание', 'gain': '💪 Набор массы' }[user.goal] || user.goal;
    const weightDisplay = user.target_weight ? `${user.weight} кг → ${user.target_weight} кг` : `${user.weight} кг`;
    const dietLabel = getDietLabel(user.diet_type);
    const activePlan = getActivePlan(chatId);
    let activePlanText = '❌ не выбран';
    if (activePlan) {
        const date = new Date(activePlan.created_at).toLocaleDateString();
        activePlanText = `📅 от ${date}`;
    }

    const card = `👤 <b>${escapeHtml(user.name || 'Пользователь')}</b>

    🎯 Цель: ${goalText}
    ⚖️ Вес: ${weightDisplay}
    🔥 Норма: ${user.calories} ккал
    🍽 Диета: ${dietLabel}
    📋 Активный рацион: ${activePlanText}

    🍗 Белки: ${user.protein} г
    🥑 Жиры: ${user.fat} г
    🍞 Углеводы: ${user.carbs} г

    💧 Вода: ${waterCurrent} / ${waterTarget} мл`.trim();

    const { mainMenuKeyboard } = require('../keyboards/menuKeyboard');
    const kb = mainMenuKeyboard();
    await sendMenu(ctx, card, kb);
}

module.exports = {
    safeDelete,
    deleteUserMessage,
    sendMenu,
    sendTempMessage,
    escapeHtml,
    updateCalculations,
    getDietLabel,
    recommendDiet,
    showMainMenu
};