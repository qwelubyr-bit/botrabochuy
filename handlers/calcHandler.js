const { Composer, InlineKeyboard } = require('grammy');
const { updateUserCtx } = require('../database');
const { calculateGoal } = require('../calculator');
const { sendMenu, sendTempMessage, recommendDiet, showMainMenu } = require('../utils/helpers');
const { genderKeyboard, activityKeyboard, goalKeyboard, dietRecommendationKeyboard, backKeyboard } = require('../keyboards/menuKeyboard');
const { generatePersonalAdvice } = require('../adviceGenerator');

const calcHandler = new Composer();

calcHandler.callbackQuery('new_calc', async (ctx) => {
    await ctx.answerCallbackQuery();
    updateUserCtx(ctx, 'step', 'name');
    return sendMenu(ctx, '👤 Как вас зовут?');
});

calcHandler.callbackQuery('male', async (ctx) => {
    await ctx.answerCallbackQuery();
    updateUserCtx(ctx, 'gender', 'male');
    updateUserCtx(ctx, 'step', 'age');
    return sendMenu(ctx, '📅 Возраст?');
});

calcHandler.callbackQuery('female', async (ctx) => {
    await ctx.answerCallbackQuery();
    updateUserCtx(ctx, 'gender', 'female');
    updateUserCtx(ctx, 'step', 'age');
    return sendMenu(ctx, '📅 Возраст?');
});

calcHandler.callbackQuery(/^act_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const activity = ctx.callbackQuery.data.replace('act_', '');
    updateUserCtx(ctx, 'activity', activity);
    updateUserCtx(ctx, 'step', 'goal');
    const kb = goalKeyboard(); 
    return sendMenu(ctx, '🎯 Цель?', kb);
});

calcHandler.callbackQuery('exit_to_menu', async (ctx) => {
    await ctx.answerCallbackQuery();
    updateUserCtx(ctx, 'step', null);
    updateUserCtx(ctx, 'temp_meal_type', null);
    updateUserCtx(ctx, 'temp_recipe_name', null);
    updateUserCtx(ctx, 'temp_recipe_category', null);
    updateUserCtx(ctx, 'temp_recipe_calories', null);
    updateUserCtx(ctx, 'temp_recipe_protein', null);
    updateUserCtx(ctx, 'temp_recipe_fat', null);
    updateUserCtx(ctx, 'temp_recipe_carbs', null);
    updateUserCtx(ctx, 'temp_recipe_ingredients', null);
    await sendTempMessage(ctx, '👋 Регистрация прервана.', 2);
    return showMainMenu(ctx);
});

calcHandler.callbackQuery(/^goal_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const goal = ctx.callbackQuery.data.replace('goal_', '');
    updateUserCtx(ctx, 'goal', goal);
    updateUserCtx(ctx, 'step', null);
    const user = ctx.state.user;
    const rec = recommendDiet(user);
    const kb = dietRecommendationKeyboard(rec);
    const fullText = `<b>${rec.text}</b>\n\nВыберите подходящий вариант питания:`;
    return sendMenu(ctx, fullText, kb);
});

calcHandler.callbackQuery(/^diet_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const diet = ctx.callbackQuery.data.replace('diet_', '');
    updateUserCtx(ctx, 'diet_type', diet);
    const user = ctx.state.user;
    const result = calculateGoal(user, user.goal, diet);
    if (!result) return sendMenu(ctx, '❌ Недостаточно данных профиля');
    updateUserCtx(ctx, 'tdee', result.tdee || (result.calories / (user.goal_factor || 1)));
    updateUserCtx(ctx, 'activity_factor', result.activity);
    updateUserCtx(ctx, 'goal_factor', user.goal === 'lose' ? 0.85 : (user.goal === 'gain' ? 1.15 : 1));
    updateUserCtx(ctx, 'bmr', result.bmr);
    updateUserCtx(ctx, 'calories', result.calories);
    updateUserCtx(ctx, 'protein', result.protein);
    updateUserCtx(ctx, 'fat', result.fat);
    updateUserCtx(ctx, 'carbs', result.carbs);
    updateUserCtx(ctx, 'goal', result.goalText);
    updateUserCtx(ctx, 'water_target', result.waterTarget);
    const personalAdvice = generatePersonalAdvice(user, diet, result);
    const finalMessage = `🎯 ${result.goalText}\n\n🔥 ${result.calories} ккал\n🍗 Белки: ${result.protein} г\n🥑 Жиры: ${result.fat} г\n🍞 Углеводы: ${result.carbs} г\n\n💧 Вода: ${result.waterTarget} мл\n\n💡 ${result.rec}\n\n✨ Персональные советы:\n${personalAdvice}`;
    updateUserCtx(ctx, 'step', null);
    const kb = new InlineKeyboard().text('🏠 В меню', 'back');
    await sendMenu(ctx, finalMessage, kb);
});

calcHandler.callbackQuery('back', async (ctx) => {
    await ctx.answerCallbackQuery();
    updateUserCtx(ctx, 'step', 'idle');
    return showMainMenu(ctx);
});

calcHandler.callbackQuery('skip_target_weight', async (ctx) => {
    await ctx.answerCallbackQuery();
    updateUserCtx(ctx, 'target_weight', null);
    updateUserCtx(ctx, 'step', 'activity');
    const kb = activityKeyboard(); 
    return sendMenu(ctx, '🏃 Выберите уровень активности', kb);
});

calcHandler.callbackQuery('confirm_reset_profile', async (ctx) => {
    await ctx.answerCallbackQuery();
    const { resetProfile } = require('../database');
    resetProfile(ctx.chat.id);
    updateUserCtx(ctx, 'step', 'name');
    await sendTempMessage(ctx, '✅ Старый профиль удалён. Начнём регистрацию заново.', 2);
    return sendMenu(ctx, '👤 Как вас зовут?');
});

module.exports = calcHandler;