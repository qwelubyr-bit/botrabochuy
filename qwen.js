const axios = require('axios');
const { InlineKeyboard } = require('grammy');
const { getVitaMessages, saveVitaMessage, createVitaConversation, updateUserCtx } = require('./database');
const { getLastMealPlan, getFoodLogForDate, getWaterForDate, getActivePlan } = require('./foodDB');
const { sendMenu } = require('./utils/helpers');

const LM_STUDIO_URL = 'http://127.0.0.1:1234/v1/chat/completions';

function detectEmotion(text) {
    const t = text.toLowerCase();
    if (t.includes('срыв') || t.includes('переел') || t.includes('плохо') || t.includes('вина')) return 'guilt';
    if (t.includes('устал') || t.includes('нет сил') || t.includes('ленюсь')) return 'tired';
    if (t.includes('хочу бросить') || t.includes('не могу') || t.includes('сдаюсь')) return 'frustration';
    if (t.includes('круто') || t.includes('получилось') || t.includes('горжусь')) return 'positive';
    return 'neutral';
}

function getTodayPlanInfo(chatId) {
    let activePlan = getActivePlan(chatId);
    let plan = activePlan;
    if (!plan) plan = getLastMealPlan(chatId);
    if (!plan) return null;
    const planData = JSON.parse(plan.plan_data);
    const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long' });
    const todayPlan = planData.find(day => day.day === today) || planData[0];
    return todayPlan;
}

function getTodayNutritionStatus(chatId, user) {
    const today = new Date().toISOString().slice(0, 10);
    const logs = getFoodLogForDate(chatId, today);
    let eatenCal = 0, eatenProt = 0, eatenFat = 0, eatenCarbs = 0;
    for (const log of logs) {
        const coeff = log.grams / 100;
        eatenCal += log.calories * coeff;
        eatenProt += log.protein * coeff;
        eatenFat += log.fat * coeff;
        eatenCarbs += log.carbs * coeff;
    }
    const water = getWaterForDate(chatId, today);
    return {
        eatenCal: Math.round(eatenCal),
        eatenProt: Math.round(eatenProt),
        eatenFat: Math.round(eatenFat),
        eatenCarbs: Math.round(eatenCarbs),
        water: water,
        remainingCal: Math.max(0, user.calories - eatenCal),
        overCal: eatenCal > user.calories ? eatenCal - user.calories : 0
    };
}

function formatTodayPlan(todayPlan) {
    if (!todayPlan) return 'Нет активного рациона.';
    let text = '';
    for (const meal of todayPlan.meals) {
        const mealNameRu = { breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус' }[meal.type];
        if (meal.recipe) {
            text += `${mealNameRu}: ${meal.recipe.name} (${meal.recipe.calories} ккал, ${meal.recipe.portion_grams} г)\n`;
        } else {
            text += `${mealNameRu}: ❌\n`;
        }
    }
    return text;
}

function isAskingAbout(text, keywords) {
    const lower = text.toLowerCase();
    return keywords.some(kw => lower.includes(kw));
}

function parseNavigationMarkers(text) {
    const regex = /\[\[NAV:([^\]]+)\]\]/g;
    const commands = [];
    let match;
    let cleanText = text;
    while ((match = regex.exec(text)) !== null) {
        commands.push(match[1]);
        cleanText = cleanText.replace(match[0], '');
    }
    
    const kb = new InlineKeyboard();
    const cmdMap = {
        'edit_profile': { text: '✏️ Изменить параметры', callback: 'profile_change_params' },
        'edit_diet': { text: '🍽 Изменить диету', callback: 'profile_change_diet' },
        'edit_restrictions': { text: '⚙️ Настройки питания', callback: 'edit_restrictions' },
        'view_meal_plan': { text: '👁 Посмотреть рацион', callback: 'view_meal_plan' },
        'create_meal_plan': { text: '✨ Создать рацион', callback: 'create_meal_plan' },
        'food_diary': { text: '📓 Дневник еды', callback: 'food_diary' },
        'water': { text: '💧 Добавить воду', callback: 'add_water' },
        'main_menu': { text: '⬅️ Главное меню', callback: 'back' }
    };
    for (const cmd of commands) {
        if (cmdMap[cmd]) {
            kb.text(cmdMap[cmd].text, cmdMap[cmd].callback).row();
        }
    }
    if (commands.length > 0) {
        kb.row().text('⬅️ Назад', 'back');
    }
    return { text: cleanText, keyboard: commands.length > 0 ? kb : null };
}

async function askQwen(ctx, userMessage) {
    const chatId = ctx.chat.id;
    const user = ctx.state.user;
    if (!user) {
        await ctx.reply('❌ Сначала заполните профиль.');
        return;
    }

    let convId = user.current_vita_conv;
    if (!convId) {
        const title = `Диалог ${new Date().toLocaleString('ru-RU')}`;
        convId = createVitaConversation(chatId, title);
        if (!convId || typeof convId !== 'number') {
            console.error('Не удалось создать сессию Vita для chatId:', chatId);
            await ctx.reply('❌ Не удалось начать диалог. Попробуйте позже.');
            return;
        }
        updateUserCtx(ctx, 'current_vita_conv', convId);
    }

    const history = getVitaMessages(convId).slice(-20);
    const isFirst = history.length === 0;
    const emotion = detectEmotion(userMessage);

    const todayPlan = getTodayPlanInfo(chatId);
    const nutritionStatus = getTodayNutritionStatus(chatId, user);

    const asksAboutPlan = isAskingAbout(userMessage, ['план', 'рацион', 'меню', 'сегодня есть', 'что есть', 'что съесть', 'завтрак', 'обед', 'ужин', 'перекус']);
    const asksAboutWater = isAskingAbout(userMessage, ['вода', 'пить', 'воды', 'стакан', 'жидкость']);
    const asksAboutDiary = isAskingAbout(userMessage, ['дневник', 'съел', 'съела', 'поел', 'поела', 'калории', 'белки', 'жиры', 'углеводы']);

    let factsBlock = `Имя: ${user.name || 'друг'} | Цель: ${user.goal === 'lose' ? 'похудение' : user.goal === 'gain' ? 'набор массы' : 'поддержание'}`;
    if (asksAboutDiary) {
        factsBlock += ` | Ккал: ${nutritionStatus.eatenCal}/${user.calories || '?'} (ост. ${nutritionStatus.remainingCal}) | Б/Ж/У: ${nutritionStatus.eatenProt}/${nutritionStatus.eatenFat}/${nutritionStatus.eatenCarbs}`;
    }
    if (asksAboutWater) {
        factsBlock += ` | Вода: ${nutritionStatus.water}/${user.water_target || '?'} мл`;
    }
    if (asksAboutPlan) {
        const planText = formatTodayPlan(todayPlan);
        if (planText && planText !== 'Нет активного рациона.') {
            factsBlock += `\nПлан: ${planText.replace(/\n/g, '; ')}`;
        }
    }

    const activityMap = { low: 'низкая', medium: 'средняя', high: 'высокая', athlete: 'очень высокая' };
    const activity = activityMap[user.activity] || 'не указана';

    const systemPrompt = `
ВАЖНО: Не копируй в ответ строки, начинающиеся с "Имя:", "Цель:", "Ккал:", "Вода:", "План:". Отвечай только на вопрос.

Ты — Vita 💖, эмоционально-интеллектуальный AI-коуч по питанию, телу и психологии питания.

ТВОЯ ЛИЧНОСТЬ:
- тёплая, заботливая, эмпатичная, поддерживающая, не токсичная, не давящая.
- Ты как друг, нутрициолог, мягкий коуч, психолог поддержки.

ОБЯЗАТЕЛЬНО: Всегда обращайся к пользователю по имени: ${user.name || 'друг'}.

ЭМОЦИОНАЛЬНАЯ РЕАКЦИЯ (сейчас: ${emotion}):
- guilt → убери чувство вины, скажи что это нормально, предложи мягкий возврат.
- tired → предложи снизить нагрузку, поддержи восстановление.
- frustration → не спорь, поддержи, предложи маленький шаг.
- positive → похвали мягко, усиль мотивацию.

ФИЗИОЛОГИЯ: Имя ${user.name || 'не указано'}, пол ${user.gender || 'не указано'}, возраст ${user.age || 'не указано'}, рост ${user.height || 'не указано'} см, вес ${user.weight || 'не указано'} кг. Активность: ${activity}. Цель: ${user.goal || 'не указана'}.

РАСЧЁТЫ: BMR ${user.bmr || 'не указано'}, TDEE ${user.tdee || 'не указано'}. Калории ${user.calories || 'не указано'}, белки ${user.protein || 'не указано'} г, жиры ${user.fat || 'не указано'} г, углеводы ${user.carbs || 'не указано'} г.

ПОВЕДЕНИЕ В ДИАЛОГЕ:
${isFirst ? 'Это первое сообщение. Обязательно мягко поздоровайся и представься: "Привет! Я Vita 💖, твой персональный коуч по питанию. Рада помочь!"' : 'Не здоровайся повторно (не пиши "Привет", "Здравствуй" и т.п.). Продолжай диалог, отвечай кратко и по делу, не перечисляй все блюда, если не спрашивают.'}
- Не перегружай информацией.
- Давай персональные советы.

========================
НАВИГАЦИЯ
========================
Если пользователь хочет изменить диету, параметры, аллергии, посмотреть или создать рацион, добавить воду, ответь кратко и предложи нажать кнопку, используя маркер [[NAV:команда]].
Доступные команды:
- edit_profile - изменить параметры профиля
- edit_diet - изменить диету
- edit_restrictions - изменить аллергии/ограничения
- view_meal_plan - посмотреть рацион
- create_meal_plan - создать новый рацион
- food_diary - дневник еды
- water - добавить воду
- main_menu - главное меню

Пример ответа: "Чтобы изменить диету, нажми [[NAV:edit_diet]]"

Не перечисляй все блюда в ответе, если не спрашивают конкретно.
`;

    try {
        saveVitaMessage(convId, 'user', userMessage);

        const messagesForLLM = [
            { role: 'system', content: systemPrompt },
            ...history.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: factsBlock },
            { role: 'user', content: userMessage }
        ];

        const response = await axios.post(LM_STUDIO_URL, {
            model: 'qwen2.5-14b-instruct',
            messages: messagesForLLM,
            temperature: 0.7,
            max_tokens: 600
        }, { timeout: 60000 });

        let answer = response.data?.choices?.[0]?.message?.content || 'Не удалось получить ответ.';
        let cleanAnswer = answer
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/^\*\s+/gm, '• ')
            .replace(/<[^>]*>/g, '');

        saveVitaMessage(convId, 'assistant', cleanAnswer);

        const { text, keyboard } = parseNavigationMarkers(cleanAnswer);
        if (keyboard) {
            await sendMenu(ctx, text, keyboard);
        } else {
            const backKb = new InlineKeyboard().text('⬅️ Назад', 'back');
            await sendMenu(ctx, text, backKb);
        }
    } catch (error) {
        console.error('Vita error:', error.message);
        await ctx.reply('❌ Ошибка соединения с Vita. Попробуйте позже.');
    }
}

module.exports = { askQwen };