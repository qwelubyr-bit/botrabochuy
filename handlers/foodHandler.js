const { Composer, InlineKeyboard, InputFile } = require('grammy');
const { updateUserCtx } = require('../database');
const { sendMenu, sendTempMessage, showMainMenu, getDietLabel } = require('../utils/helpers');
const { foodMainKeyboard, weeklyRationalKeyboard, budgetKeyboard, foodDiaryKeyboard, backKeyboard } = require('../keyboards/menuKeyboard');
const { generateWeeklyPlan, generateDailyPlan } = require('../mealPlanner');
const { generateMealPlanPDF } = require('../utils/pdfExport');
const { saveMealPlan, getLastMealPlan, getRecipeById, getFoodLogForDate, logFood, searchProducts, getAllMealPlans, deleteMealPlan, getMealPlanById, setActivePlan, getActivePlan } = require('../foodDB');

const foodHandler = new Composer();

const mealNameMap = {
    'breakfast': '🍳 Завтрак',
    'lunch': '🍲 Обед',
    'dinner': '🍽 Ужин',
    'snack': '🍎 Перекус'
};

foodHandler.callbackQuery('main_food', async (ctx) => {
    await ctx.answerCallbackQuery();
    const kb = foodMainKeyboard();
    return sendMenu(ctx, '🍽 <b>Раздел питания</b>\n\nВыберите действие:', kb);
});

foodHandler.callbackQuery('weekly_rational', async (ctx) => {
    await ctx.answerCallbackQuery();
    const kb = weeklyRationalKeyboard();
    return sendMenu(ctx, '📅 <b>Рацион на неделю</b>\n\nВыберите действие:', kb);
});

foodHandler.callbackQuery('create_meal_plan', async (ctx) => {
    await ctx.answerCallbackQuery();
    const user = ctx.state.user;
    if (!user || !user.calories) {
        return sendMenu(ctx, '❌ Сначала заполните профиль и рассчитайте диету.');
    }
    const currentBudget = user.budget_level || 2;
    const kb = budgetKeyboard(currentBudget);
    return sendMenu(ctx, '💵 <b>Выберите бюджет на питание</b>\n\nЭто влияет на подбор блюд в рационе.\nТекущий бюджет отмечен ✅', kb);
});

foodHandler.callbackQuery(/^set_budget_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const level = parseInt(ctx.callbackQuery.data.split('_')[2]);
    updateUserCtx(ctx, 'budget_level', level);
    await sendTempMessage(ctx, `✅ Бюджет сохранён: ${level === 1 ? 'Низкий' : level === 2 ? 'Средний' : 'Высокий'}`, 3);
    return generateAndShowPlan(ctx, level);
});

foodHandler.callbackQuery('view_meal_plan', async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat.id;
    const plans = getAllMealPlans(chatId);
    if (!plans || plans.length === 0) {
        await sendTempMessage(ctx, '❌ У вас нет сохранённых рационов. Создайте новый через «Создать рацион».', 5);
        return showMainMenu(ctx);
    }
    const currentUser = ctx.state.user;
    const currentDiet = currentUser.diet_type;

    const text = '📋 <b>Ваши сохранённые рационы</b>\n\nВыберите рацион для просмотра:';
    const kb = new InlineKeyboard();
    for (const plan of plans) {
        const date = new Date(plan.created_at).toLocaleDateString();
        const budget = plan.budget_level === 1 ? 'Низкий' : plan.budget_level === 2 ? 'Средний' : 'Высокий';
        const dietLabel = getDietLabel(plan.diet_type);
        let warning = '';
        if (plan.diet_type && plan.diet_type !== currentDiet) {
            warning = ' ⚠️';
        }
        const planTitle = `${date} | ${budget} | ${dietLabel}${warning}`;
        kb.text(planTitle, `view_plan_${plan.id}`).row();
    }
    kb.row().text('⬅️ Назад', 'weekly_rational');
    return sendMenu(ctx, text, kb);
});

foodHandler.callbackQuery(/^view_plan_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const planId = parseInt(ctx.callbackQuery.data.split('_')[2]);
    const chatId = ctx.chat.id;
    const plan = getMealPlanById(planId);
    if (!plan) {
        return sendTempMessage(ctx, '❌ Рацион не найден.', 3);
    }
    const currentUser = ctx.state.user;
    if (plan.diet_type && plan.diet_type !== currentUser.diet_type) {
        await sendTempMessage(ctx, `⚠️ Внимание! Этот рацион был создан для диеты "${getDietLabel(plan.diet_type)}", а сейчас у вас выбрана "${getDietLabel(currentUser.diet_type)}". Соответствие КБЖУ может не выполняться.`, 5);
    }
    const planData = JSON.parse(plan.plan_data);
    let text = `📋 <b>Рацион от ${new Date(plan.created_at).toLocaleDateString()}</b>\n`;
    text += `💰 Бюджет: ${plan.budget_level === 1 ? 'Низкий' : plan.budget_level === 2 ? 'Средний' : 'Высокий'}\n`;
    text += `🍽 Диета: ${getDietLabel(plan.diet_type)}\n\n`;
    const kb = new InlineKeyboard();
    for (let i = 0; i < planData.length; i++) {
        const day = planData[i];
        text += `📅 ${day.day}\n`;
        for (const meal of day.meals) {
            const mealNameRu = mealNameMap[meal.type] || meal.type;
            if (meal.recipe) {
                text += `   ${mealNameRu}: <b>${meal.recipe.name}</b> (${meal.recipe.calories} ккал, ${meal.recipe.portion_grams} г)\n`;
                kb.text(`📖 ${meal.recipe.name}`, `view_recipe_${meal.recipe.id}_plan`).row();
            } else {
                text += `   ${mealNameRu}: ❌\n`;
            }
        }
        text += '\n';
    }
    kb.row().text('📄 Скачать рацион PDF', `export_pdf_${plan.id}`).row();
    kb.row().text('🗑 Удалить этот рацион', `delete_plan_${plan.id}`).row();
    kb.row().text('⭐ Сделать активным', `set_active_plan_${planId}`).row();
    kb.row().text('⬅️ Назад к списку', 'view_meal_plan');
    return sendMenu(ctx, text, kb);
});

foodHandler.callbackQuery(/^delete_plan_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const planId = parseInt(ctx.callbackQuery.data.split('_')[2]);
    const chatId = ctx.chat.id;
    deleteMealPlan(planId);
    const active = getActivePlan(chatId);
    if (active && active.id === planId) {
        setActivePlan(chatId, null);
    }
    await sendTempMessage(ctx, '✅ Рацион удалён.', 3);
    const plans = getAllMealPlans(chatId);
    if (!plans || plans.length === 0) {
        await sendTempMessage(ctx, 'У вас больше нет сохранённых рационов.', 3);
        return showMainMenu(ctx);
    }
    const currentUser = ctx.state.user;
    const currentDiet = currentUser.diet_type;
    let text = '📋 <b>Ваши сохранённые рационы</b>\n\nВыберите рацион для просмотра:';
    const kb = new InlineKeyboard();
    for (const p of plans) {
        const date = new Date(p.created_at).toLocaleDateString();
        const budget = p.budget_level === 1 ? 'Низкий' : p.budget_level === 2 ? 'Средний' : 'Высокий';
        const dietLabel = getDietLabel(p.diet_type);
        let warning = (p.diet_type && p.diet_type !== currentDiet) ? ' ⚠️' : '';
        kb.text(`${date} | ${budget} | ${dietLabel}${warning}`, `view_plan_${p.id}`).row();
    }
    kb.row().text('⬅️ Назад', 'weekly_rational');
    return sendMenu(ctx, text, kb);
});

foodHandler.callbackQuery(/^set_active_plan_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const planId = parseInt(ctx.callbackQuery.data.split('_')[3]);
    const chatId = ctx.chat.id;
    setActivePlan(chatId, planId);
    await sendTempMessage(ctx, '✅ Этот рацион установлен как текущий (активный).', 3);
    return showMainMenu(ctx);
});


foodHandler.callbackQuery(/^view_recipe_(\d+)_plan$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const recipeId = parseInt(ctx.callbackQuery.data.match(/\d+/)[0]);
    const recipe = getRecipeById(recipeId);
    if (!recipe) return sendTempMessage(ctx, '❌ Рецепт не найден.', 3);
    const recipeText = `<b>${recipe.name}</b>\n\n🍽 Категория: ${recipe.category}\n⚖️ Вес порции: ${recipe.portion_grams} г\n🔥 ${recipe.calories} ккал | 🍗 ${recipe.protein}г | 🥑 ${recipe.fat}г | 🍞 ${recipe.carbs}г\n\n<b>Ингредиенты:</b>\n${recipe.ingredients}\n\n<b>Приготовление:</b>\n${recipe.instructions}`;
    const kb = new InlineKeyboard().text('⬅️ Назад', 'view_meal_plan');
    return sendMenu(ctx, recipeText, kb);
});

foodHandler.callbackQuery('food_diary', async (ctx) => {
    await ctx.answerCallbackQuery();
    const kb = foodDiaryKeyboard();
    return sendMenu(ctx, '📓 <b>Дневник еды</b>\n\nЧто хотите сделать?', kb);
});

foodHandler.callbackQuery('add_food_entry', async (ctx) => {
    await ctx.answerCallbackQuery();
    updateUserCtx(ctx, 'step', 'food_add_product');
    const kb = new InlineKeyboard().text('❌ Отмена', 'cancel_food_entry');
    return sendMenu(ctx, '🍽 Введите название продукта и вес в граммах через пробел.\nПример: <code>гречка 150</code>\n\nИли нажмите «Отмена», чтобы выйти.', kb);
});

foodHandler.callbackQuery('cancel_food_entry', async (ctx) => {
    await ctx.answerCallbackQuery();
    updateUserCtx(ctx, 'step', null);
    await sendTempMessage(ctx, '❌ Добавление еды отменено.', 2);
    const kb = foodDiaryKeyboard();
    return sendMenu(ctx, '📓 <b>Дневник еды</b>\n\nЧто дальше?', kb);
});

foodHandler.callbackQuery('add_water', async (ctx) => {
    await ctx.answerCallbackQuery();
    updateUserCtx(ctx, 'step', 'add_water_amount');
    const kb = new InlineKeyboard().text('❌ Отмена', 'cancel_water');
    return sendMenu(ctx, '💧 Введите количество воды в миллилитрах (или количество стаканов, например: "2 стакана", 1 стакан = 250 мл):\n\nИли нажмите «Отмена», чтобы выйти.', kb);
});

foodHandler.callbackQuery('cancel_water', async (ctx) => {
    await ctx.answerCallbackQuery();
    updateUserCtx(ctx, 'step', null);
    await sendTempMessage(ctx, '❌ Добавление воды отменено.', 2);
    const kb = foodDiaryKeyboard();
    return sendMenu(ctx, '📓 <b>Дневник еды</b>\n\nЧто дальше?', kb);
});

foodHandler.callbackQuery('food_stats_today', async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat.id;
    const today = new Date().toISOString().slice(0,10);
    const logs = getFoodLogForDate(chatId, today);
    let totalCal = 0, totalProt = 0, totalFat = 0, totalCarbs = 0;
    for (const log of logs) {
        const coeff = log.grams / 100;
        totalCal += log.calories * coeff;
        totalProt += log.protein * coeff;
        totalFat += log.fat * coeff;
        totalCarbs += log.carbs * coeff;
    }
    const user = ctx.state.user;
    const text = `📊 <b>Статистика за сегодня</b>\n\n🔥 Калории: ${Math.round(totalCal)} / ${user.calories || '?'} ккал\n🍗 Белки: ${Math.round(totalProt)} / ${user.protein || '?'} г\n🥑 Жиры: ${Math.round(totalFat)} / ${user.fat || '?'} г\n🍞 Углеводы: ${Math.round(totalCarbs)} / ${user.carbs || '?'} г`;
    const kb = backKeyboard('food_diary');
    return sendMenu(ctx, text, kb);
});

foodHandler.callbackQuery('create_day_plan', async (ctx) => {
    await ctx.answerCallbackQuery();
    const user = ctx.state.user;
    if (!user || !user.calories) return sendMenu(ctx, '❌ Сначала заполните профиль.');
    const budgetLevel = user.budget_level || 2;
    const dayPlan = generateDailyPlan(user, budgetLevel);
    let text = '🍽 <b>Ваш рацион на сегодня</b>\n\n';
    for (const meal of dayPlan.meals) {
        const mealNameRu = mealNameMap[meal.type] || meal.type;
        if (meal.recipe) {
            text += `${mealNameRu}: <b>${meal.recipe.name}</b> (${meal.recipe.calories} ккал, ${meal.recipe.portion_grams} г)\n`;
        } else {
            text += `${mealNameRu}: ❌ не найдено\n`;
        }
    }
    const kb = new InlineKeyboard().text('🔄 Другой вариант', 'create_day_plan').row().text('⬅️ Назад', 'weekly_rational');
    return sendMenu(ctx, text, kb);
});

async function generateAndShowPlan(ctx, budgetLevel) {
    const chatId = ctx.chat.id;
    const user = ctx.state.user;
    if (!user?.calories) return sendMenu(ctx, '❌ Сначала заполните профиль.');

    await sendTempMessage(ctx, '🔄 Генерируем рацион...', 10);
    const plan = generateWeeklyPlan(user, budgetLevel);
    const today = new Date().toISOString().slice(0, 10);
    const planId = saveMealPlan(chatId, today, budgetLevel, plan, user.diet_type);
    setActivePlan(chatId, planId);

    let text = '✅ <b>Рацион создан!</b>\n\n';
    for (const day of plan) {
        text += `📅 ${day.day}\n`;
        for (const meal of day.meals) {
            const mealNameRu = mealNameMap[meal.type] || meal.type;
            text += `   ${mealNameRu}: ${meal.recipe ? `${meal.recipe.name} (${meal.recipe.calories} ккал, ${meal.recipe.portion_grams} г)` : '❌'}\n`;
        }
        text += '\n';
    }
    text += `Полный рацион сохранён. Вы можете посмотреть его в меню «Посмотреть рацион» и удалить при необходимости.`;
    const kb = backKeyboard('weekly_rational');
    return sendMenu(ctx, text, kb);
}

foodHandler.callbackQuery(/^export_pdf_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const planId = parseInt(ctx.callbackQuery.data.split('_')[2]);
    const chatId = ctx.chat.id;
    const plan = getMealPlanById(planId);
    if (!plan) {
        return sendTempMessage(ctx, '❌ Рацион не найден.', 3);
    }
    const user = ctx.state.user;
    const planDate = new Date(plan.created_at).toLocaleDateString();

    await sendTempMessage(ctx, '📄 Генерируем PDF... Это займёт несколько секунд.', 5);

    try {
        const pdfPath = await generateMealPlanPDF(plan, user, planDate);
        const fs = require('fs');
        if (!fs.existsSync(pdfPath)) {
            throw new Error('Файл не создан');
        }
        const file = new InputFile(pdfPath);

        const sentMessage = await ctx.replyWithDocument(file, {
            filename: `ratzion_${planDate}.pdf`,
            caption: '📄 Ваш рацион. Файл будет автоматически удалён через 5 минут.'
        });

        fs.unlinkSync(pdfPath);

        setTimeout(async () => {
            try {
                await ctx.api.deleteMessage(chatId, sentMessage.message_id);
                console.log(`✅ PDF сообщение удалено через 5 минут (chatId: ${chatId})`);
            } catch (e) {
                console.error(`❌ Не удалось удалить PDF сообщение: ${e.message}`);
            }
        }, 5 * 60 * 1000);

    } catch (err) {
        console.error('PDF generation error:', err);
        await sendTempMessage(ctx, '❌ Ошибка при создании PDF. Попробуйте позже.\n' + err.message, 5);
    }
});

module.exports = foodHandler;