const { Composer, InlineKeyboard } = require('grammy');
const { createUser, updateUserCtx } = require('../database');
const { sendMenu, sendTempMessage, updateCalculations, showMainMenu } = require('../utils/helpers');
const { genderKeyboard, activityKeyboard, foodDiaryKeyboard, editParamsKeyboard } = require('../keyboards/menuKeyboard');
const { askQwen } = require('../qwen');
const { searchProducts, logFood, searchRecipes, logWater } = require('../foodDB');
const { db } = require('../database');

const messageHandler = new Composer();

messageHandler.on('message:text', async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;
    if (!text) return;

    if (!text.startsWith('/')) {
        try { await ctx.deleteMessage(); } catch {}
    }

    let user = ctx.state.user;
    if (!user) {
        createUser(chatId);
        const { getUser } = require('../database');
        user = getUser(chatId);
        ctx.state.user = user;
    }
    if (!user) return;

    if (user.step === 'name') {
        updateUserCtx(ctx, 'name', text.trim());
        updateUserCtx(ctx, 'step', 'gender');
        const kb = genderKeyboard();
        return sendMenu(ctx, 'Укажите пол', kb);
    }

    if (user.step === 'qwen') {
        const thinking = await ctx.reply('🤖 Vita думает...');
        await askQwen(ctx, text);
        try { await ctx.api.deleteMessage(chatId, thinking.message_id); } catch {}
        return;
    }

    if (user.step === 'edit_param_name') {
        const newName = text.trim();
        if (newName) updateUserCtx(ctx, 'name', newName);
        updateUserCtx(ctx, 'step', 'edit_params_menu');
        updateCalculations(chatId);
        const kb = editParamsKeyboard();
        return sendMenu(ctx, '✏️ <b>Редактирование параметров</b>\n\nВыберите, что хотите изменить:', kb);
    }
    if (user.step === 'edit_param_age') {
        const age = Number(text);
        if (isNaN(age) || age < 10 || age > 120) return sendTempMessage(ctx, '❌ Введите возраст числом (10–120)');
        updateUserCtx(ctx, 'age', age);
        updateUserCtx(ctx, 'step', 'edit_params_menu');
        updateCalculations(chatId);
        const kb = editParamsKeyboard();
        return sendMenu(ctx, '✏️ <b>Редактирование параметров</b>\n\nВыберите, что хотите изменить:', kb);
    }
    if (user.step === 'edit_param_height') {
        const height = Number(text);
        if (isNaN(height) || height < 50 || height > 250) return sendTempMessage(ctx, '❌ Введите рост числом (50–250 см)');
        updateUserCtx(ctx, 'height', height);
        updateUserCtx(ctx, 'step', 'edit_params_menu');
        updateCalculations(chatId);
        const kb = editParamsKeyboard();
        return sendMenu(ctx, '✏️ <b>Редактирование параметров</b>\n\nВыберите, что хотите изменить:', kb);
    }
    if (user.step === 'edit_param_weight') {
        const weight = Number(text);
        if (isNaN(weight) || weight < 20 || weight > 300) return sendTempMessage(ctx, '❌ Введите вес числом (20–300 кг)');
        updateUserCtx(ctx, 'weight', weight);
        updateUserCtx(ctx, 'step', 'edit_params_menu');
        updateCalculations(chatId);
        const kb = editParamsKeyboard();
        return sendMenu(ctx, '✏️ <b>Редактирование параметров</b>\n\nВыберите, что хотите изменить:', kb);
    }
    if (user.step === 'edit_param_target_weight') {
        const target = Number(text);
        if (isNaN(target) || target < 20 || target > 300) return sendTempMessage(ctx, '❌ Введите целевой вес числом (20–300 кг)');
        updateUserCtx(ctx, 'target_weight', target);
        updateUserCtx(ctx, 'step', 'edit_params_menu');
        updateCalculations(chatId);
        const kb = editParamsKeyboard();
        return sendMenu(ctx, '✏️ <b>Редактирование параметров</b>\n\nВыберите, что хотите изменить:', kb);
    }

    if (user.step === 'food_add_product') {
        const textLower = text.trim().toLowerCase();
        if (textLower === 'отмена' || textLower === 'назад' || textLower === '/cancel') {
            updateUserCtx(ctx, 'step', null);
            await sendTempMessage(ctx, '❌ Добавление еды отменено.', 2);
            const kb = foodDiaryKeyboard();
            return sendMenu(ctx, '📓 <b>Дневник еды</b>\n\nЧто дальше?', kb);
        }

        const parts = text.trim().split(' ');
        if (parts.length < 2) return sendTempMessage(ctx, '❌ Введите продукт и вес через пробел, например: "рис 100"');
        const grams = parseInt(parts.pop());
        if (isNaN(grams) || grams <= 0 || grams > 2000) return sendTempMessage(ctx, '❌ Вес должен быть числом от 1 до 2000 г');
        const productQuery = parts.join(' ').toLowerCase();
        const products = searchProducts(productQuery, 1);
        if (!products.length) return sendTempMessage(ctx, `❌ Продукт "${productQuery}" не найден в базе. Попробуйте другое название.`, 10);
        const product = products[0];
        const mealType = 'other';
        const today = new Date().toISOString().slice(0,10);
        logFood(chatId, today, mealType, product.id, grams);
        updateUserCtx(ctx, 'step', null);
        updateUserCtx(ctx, 'temp_meal_type', null);
        await sendTempMessage(ctx, `✅ Добавлено: ${product.name} ${grams}г (${Math.round(product.calories * grams / 100)} ккал)`, 3);
        const kb = foodDiaryKeyboard();
        return sendMenu(ctx, '📓 <b>Дневник еды</b>\n\nЧто дальше?', kb);
    }

    if (user.step === 'add_water_amount') {
        const textLower = text.trim().toLowerCase();
        if (textLower === 'отмена' || textLower === 'назад' || textLower === '/cancel') {
            updateUserCtx(ctx, 'step', null);
            await sendTempMessage(ctx, '❌ Добавление воды отменено.', 2);
            const kb = foodDiaryKeyboard();
            return sendMenu(ctx, '📓 <b>Дневник еды</b>\n\nЧто дальше?', kb);
        }

        let amountMl = 0;
        if (textLower.includes('стакан')) {
            const match = textLower.match(/(\d+)/);
            const glasses = match ? parseInt(match[1]) : 1;
            amountMl = glasses * 250;
        } else {
            const match = textLower.match(/(\d+)/);
            if (!match) return sendTempMessage(ctx, '❌ Введите число (мл) или количество стаканов, например: 250 или 2 стакана');
            amountMl = parseInt(match[1]);
        }

        if (isNaN(amountMl) || amountMl <= 0 || amountMl > 5000) {
            return sendTempMessage(ctx, '❌ Введите корректное количество (до 5000 мл)');
        }

        const today = new Date().toISOString().slice(0,10);
        logWater(chatId, today, amountMl);
        updateUserCtx(ctx, 'step', null);
        await sendTempMessage(ctx, `✅ Добавлено ${amountMl} мл воды`, 3);
        const kb = foodDiaryKeyboard();
        return sendMenu(ctx, '📓 <b>Дневник еды</b>\n\nЧто дальше?', kb);
    }

    if (user.step === 'search_recipe_name') {
    const query = text.trim();
    if (query.length < 2) return sendTempMessage(ctx, '❌ Введите минимум 2 символа', 3);
    const results = searchRecipes(query, 10);
    if (!results.length) return sendTempMessage(ctx, `❌ По запросу "${query}" ничего не найдено.`, 3);
    let out = `🔍 <b>Результаты поиска: "${query}"</b>\n\n`;
    const kb = new InlineKeyboard();
    for (const r of results) {
        out += `• ${r.name} – ${r.calories} ккал\n`;
        kb.text(`📖 ${r.name}`, `view_recipe_${r.id}_base`).row();
    }
    kb.row().text('⬅️ Назад', 'recipes_base');
    updateUserCtx(ctx, 'step', null);
    return sendMenu(ctx, out, kb);

    }

    if (user.step === 'add_recipe_name') {
        const name = text.trim();
        if (name.length < 3) return sendTempMessage(ctx, '❌ Название должно содержать минимум 3 символа', 3);
        updateUserCtx(ctx, 'temp_recipe_name', name);
        updateUserCtx(ctx, 'step', 'add_recipe_category');
        const kb = new InlineKeyboard()
            .text('🍳 Завтрак', 'set_cat_breakfast')
            .text('🍲 Обед', 'set_cat_lunch')
            .row()
            .text('🍽 Ужин', 'set_cat_dinner')
            .text('🍎 Перекус', 'set_cat_snack')
            .row()
            .text('❌ Отмена', 'cancel_add_recipe');
        return sendMenu(ctx, 'Выберите категорию блюда:', kb);
    }

    if (user.step === 'add_recipe_calories') {
        const calories = Number(text);
        if (isNaN(calories) || calories < 10 || calories > 2000) {
            return sendTempMessage(ctx, '❌ Введите корректное количество калорий (10-2000 ккал)', 3);
        }
        updateUserCtx(ctx, 'temp_recipe_calories', calories);
        updateUserCtx(ctx, 'step', 'add_recipe_protein');
        return sendMenu(ctx, '🥩 Введите количество белков (грамм на порцию):');
    }

    if (user.step === 'add_recipe_protein') {
        const protein = Number(text);
        if (isNaN(protein) || protein < 0 || protein > 200) {
            return sendTempMessage(ctx, '❌ Введите корректное количество белков (0-200 г)', 3);
        }
        updateUserCtx(ctx, 'temp_recipe_protein', protein);
        updateUserCtx(ctx, 'step', 'add_recipe_fat');
        return sendMenu(ctx, '🥑 Введите количество жиров (грамм на порцию):');
    }

    if (user.step === 'add_recipe_fat') {
        const fat = Number(text);
        if (isNaN(fat) || fat < 0 || fat > 200) {
            return sendTempMessage(ctx, '❌ Введите корректное количество жиров (0-200 г)', 3);
        }
        updateUserCtx(ctx, 'temp_recipe_fat', fat);
        updateUserCtx(ctx, 'step', 'add_recipe_carbs');
        return sendMenu(ctx, '🍞 Введите количество углеводов (грамм на порцию):');
    }

    if (user.step === 'add_recipe_carbs') {
        const carbs = Number(text);
        if (isNaN(carbs) || carbs < 0 || carbs > 200) {
            return sendTempMessage(ctx, '❌ Введите корректное количество углеводов (0-200 г)', 3);
        }
        updateUserCtx(ctx, 'temp_recipe_carbs', carbs);
        updateUserCtx(ctx, 'step', 'add_recipe_grams');
        return sendMenu(ctx, '⚖️ Введите вес одной порции в граммах (например: 250):');
    }

    if (user.step === 'add_recipe_grams') {
        const grams = Number(text);
        if (isNaN(grams) || grams < 20 || grams > 2000) {
            return sendTempMessage(ctx, '❌ Введите число от 20 до 2000 грамм', 3);
        }
        updateUserCtx(ctx, 'temp_recipe_grams', grams);
        updateUserCtx(ctx, 'step', 'add_recipe_ingredients');
        return sendMenu(ctx, '📝 Введите список ингредиентов (кратко, через запятую):');
    }

    if (user.step === 'add_recipe_ingredients') {
        const ingredients = text.trim();
        if (ingredients.length < 5) return sendTempMessage(ctx, '❌ Введите хотя бы 5 символов', 3);
        updateUserCtx(ctx, 'temp_recipe_ingredients', ingredients);
        updateUserCtx(ctx, 'step', 'add_recipe_instructions');
        return sendMenu(ctx, '👨‍🍳 Введите пошаговую инструкцию приготовления:');
    }

    if (user.step === 'add_recipe_instructions') {
        const instructions = text.trim();
        if (instructions.length < 10) return sendTempMessage(ctx, '❌ Инструкция слишком короткая', 3);

        const name = user.temp_recipe_name;
        const category = user.temp_recipe_category;
        const calories = user.temp_recipe_calories;
        const protein = user.temp_recipe_protein;
        const fat = user.temp_recipe_fat;
        const carbs = user.temp_recipe_carbs;
        const portionGrams = user.temp_recipe_grams || 250; 
        const ingredientsList = user.temp_recipe_ingredients;
        const instructionsText = instructions;
        const priceLevel = 2;
        const dietTypes = 'balanced';

        const stmt = db.prepare(`
            INSERT INTO recipes (name, category, calories, protein, fat, carbs, price_level, diet_types, ingredients, instructions, portion_grams)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(name, category, calories, protein, fat, carbs, priceLevel, dietTypes, ingredientsList, instructionsText, portionGrams);

        updateUserCtx(ctx, 'step', null);
        updateUserCtx(ctx, 'temp_recipe_name', null);
        updateUserCtx(ctx, 'temp_recipe_category', null);
        updateUserCtx(ctx, 'temp_recipe_calories', null);
        updateUserCtx(ctx, 'temp_recipe_protein', null);
        updateUserCtx(ctx, 'temp_recipe_fat', null);
        updateUserCtx(ctx, 'temp_recipe_carbs', null);
        updateUserCtx(ctx, 'temp_recipe_grams', null);
        updateUserCtx(ctx, 'temp_recipe_ingredients', null);

        await sendTempMessage(ctx, `✅ Рецепт "${name}" успешно добавлен в базу!`, 4);
        const kb = new InlineKeyboard().text('⬅️ Назад', 'recipes_base');
        return sendMenu(ctx, '📚 <b>База рецептов</b>\n\nРецепт добавлен!', kb);
    }

    if (user.step === 'age') {
        const age = Number(text);
        if (isNaN(age) || age < 10 || age > 120) return sendTempMessage(ctx, '❌ Введите возраст числом (от 10 до 120)');
        updateUserCtx(ctx, 'age', age);
        updateUserCtx(ctx, 'step', 'height');
        return sendMenu(ctx, '📏 Рост?');
    }
    if (user.step === 'height') {
        const height = Number(text);
        if (isNaN(height) || height < 50 || height > 250) return sendTempMessage(ctx, '❌ Введите рост числом (от 50 до 250 см)');
        updateUserCtx(ctx, 'height', height);
        updateUserCtx(ctx, 'step', 'weight');
        return sendMenu(ctx, '⚖️ Вес?');
    }
    if (user.step === 'weight') {
        const weight = Number(text);
        if (isNaN(weight) || weight < 20 || weight > 300) {
            return sendTempMessage(ctx, '❌ Введите вес числом (от 20 до 300 кг)');
        }
        updateUserCtx(ctx, 'weight', weight);
        updateUserCtx(ctx, 'step', 'target_weight');
        const kb = new InlineKeyboard().text('⏩ Пропустить', 'skip_target_weight');
        return sendMenu(ctx, '🎯 Какого веса хотите достичь?\n\nЕсли не знаете, нажмите «Пропустить»', kb);
    }
    if (user.step === 'target_weight') {
        const target = Number(text);
        if (!isNaN(target) && target >= 20 && target <= 300) {
            updateUserCtx(ctx, 'target_weight', target);
            updateUserCtx(ctx, 'step', 'activity');
            const kb = activityKeyboard();
            return sendMenu(ctx, '🏃 Выберите уровень активности', kb);
        } else {
            const kb = new InlineKeyboard().text('⏩ Пропустить', 'skip_target_weight');
            return sendMenu(ctx, '🎯 Какого веса хотите достичь?\n\nВведите число от 20 до 300 кг, или нажмите «Пропустить» (тогда целевой вес не будет установлен).', kb);
        }
    }
});

module.exports = messageHandler;