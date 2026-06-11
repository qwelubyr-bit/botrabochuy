const { Composer, InlineKeyboard } = require('grammy');
const { sendMenu, sendTempMessage } = require('../utils/helpers');
const { getRecipesByBudget, getRecipeById, searchRecipes } = require('../foodDB');
const { updateUserCtx } = require('../database');

const recipesHandler = new Composer();

recipesHandler.callbackQuery('recipes_base', async (ctx) => {
    await ctx.answerCallbackQuery();
    const user = ctx.state.user;
    const budget = user?.budget_level || 2;
    const diet = user?.diet_type || 'balanced';
    const kb = new InlineKeyboard()
        .text('🔍 Поиск по названию', 'search_recipe')
        .row()
        .text('➕ Добавить рецепт', 'add_recipe_start')
        .row()
        .text('🍳 Завтраки', 'filter_breakfast')
        .text('🍲 Обеды', 'filter_lunch')
        .row()
        .text('🍽 Ужины', 'filter_dinner')
        .text('🍎 Перекусы', 'filter_snack')
        .row()
        .text('⬅️ Назад', 'back');
    return sendMenu(ctx, '📚 <b>База рецептов</b>\n\nВыберите действие:', kb);
});

recipesHandler.callbackQuery(/^filter_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const category = ctx.callbackQuery.data.split('_')[1];
    const user = ctx.state.user;
    const budget = user?.budget_level || 2;
    const diet = user?.diet_type || 'balanced';
    const recipes = getRecipesByBudget(budget, diet, 50);
    const filtered = recipes.filter(r => r.category === category);
    if (filtered.length === 0) {
        return sendTempMessage(ctx, '❌ Рецептов в этой категории не найдено.', 3);
    }
    let text = `🍽 <b>Рецепты (${category})</b>\n\n`;
    const kb = new InlineKeyboard();
    for (const r of filtered.slice(0, 15)) {
        text += `• ${r.name} – ${r.calories} ккал\n`;
        kb.text(`📖 ${r.name}`, `view_recipe_${r.id}_base`).row();
    }
    kb.row().text('⬅️ Назад', 'recipes_base');
    return sendMenu(ctx, text, kb);
});

recipesHandler.callbackQuery(/^view_recipe_(\d+)_base$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const recipeId = parseInt(ctx.callbackQuery.data.match(/\d+/)[0]);
    const recipe = getRecipeById(recipeId);
    if (!recipe) return sendTempMessage(ctx, '❌ Рецепт не найден.', 3);
    const recipeText = `<b>${recipe.name}</b>\n\n🍽 Категория: ${recipe.category}\n⚖️ Вес порции: ${recipe.portion_grams} г\n🔥 ${recipe.calories} ккал | 🍗 ${recipe.protein}г | 🥑 ${recipe.fat}г | 🍞 ${recipe.carbs}г\n\n<b>Ингредиенты:</b>\n${recipe.ingredients}\n\n<b>Приготовление:</b>\n${recipe.instructions}`;
    const kb = new InlineKeyboard().text('⬅️ Назад', 'recipes_base');
    return sendMenu(ctx, recipeText, kb);
});

recipesHandler.callbackQuery('search_recipe', async (ctx) => {
    await ctx.answerCallbackQuery();
    updateUserCtx(ctx, 'step', 'search_recipe_name');
    return sendMenu(ctx, '🔍 Введите название рецепта (или его часть):');
});

recipesHandler.callbackQuery('add_recipe_start', async (ctx) => {
    await ctx.answerCallbackQuery();
    updateUserCtx(ctx, 'step', 'add_recipe_name');
    return sendMenu(ctx, '📝 <b>Добавление нового рецепта</b>\n\nВведите название блюда:');
});

recipesHandler.callbackQuery('cancel_add_recipe', async (ctx) => {
    await ctx.answerCallbackQuery();
    updateUserCtx(ctx, 'step', null);
    updateUserCtx(ctx, 'temp_recipe_name', null);
    updateUserCtx(ctx, 'temp_recipe_category', null);
    updateUserCtx(ctx, 'temp_recipe_calories', null);
    updateUserCtx(ctx, 'temp_recipe_protein', null);
    updateUserCtx(ctx, 'temp_recipe_fat', null);
    updateUserCtx(ctx, 'temp_recipe_carbs', null);
    updateUserCtx(ctx, 'temp_recipe_grams', null);
    updateUserCtx(ctx, 'temp_recipe_ingredients', null);
    return sendMenu(ctx, '❌ Добавление рецепта отменено.', new InlineKeyboard().text('⬅️ Назад', 'recipes_base'));
});

recipesHandler.callbackQuery(/^set_cat_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const category = ctx.callbackQuery.data.split('_')[2];
    updateUserCtx(ctx, 'temp_recipe_category', category);
    updateUserCtx(ctx, 'step', 'add_recipe_calories');
    return sendMenu(ctx, '🔥 Введите количество калорий на порцию (число, например: 350):');
});

module.exports = recipesHandler;