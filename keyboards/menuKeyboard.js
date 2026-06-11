const { InlineKeyboard } = require('grammy');

function mainMenuKeyboard() {
    return new InlineKeyboard()
        .text('👤 Профиль', 'main_profile')
        .text('🍽 Питание', 'main_food')
        .row()
        .text('📚 Рецепты', 'recipes_base')
        .row()
        .text('🤖 Vita AI', 'main_vita');
}

function profileManagementKeyboard() {
    return new InlineKeyboard()
        .text('🍽 Изменить диету', 'profile_change_diet')
        .row()
        .text('✏️ Изменить параметры', 'profile_change_params')
        .row()
        .text('⚙️ Настройки питания', 'edit_restrictions')
        .row()
        .text('🗑 Удалить профиль', 'profile_delete')
        .row()
        .text('⬅️ Назад', 'profile_back');
}

function editParamsKeyboard() {
    return new InlineKeyboard()
        .text('👤 Имя', 'param_name')
        .text('🚻 Пол', 'param_gender')
        .row()
        .text('📅 Возраст', 'param_age')
        .text('📏 Рост', 'param_height')
        .row()
        .text('⚖️ Вес', 'param_weight')
        .text('🎯 Целевой вес', 'param_target_weight')
        .row()
        .text('🏃 Активность', 'param_activity')
        .text('🎯 Цель', 'param_goal')
        .row()
        .text('⬅️ Назад в профиль', 'back_to_profile_management');
}

function genderKeyboard(prefix = null) {
    if (prefix) {
        return new InlineKeyboard()
            .text('👨 Мужчина', `${prefix}_male`)
            .text('👩 Женщина', `${prefix}_female`);
    }
    return new InlineKeyboard()
        .text('👨 Мужчина', 'male')
        .text('👩 Женщина', 'female');
}

function activityKeyboard(prefix = null) {
    const kb = new InlineKeyboard();
    if (prefix) {
        kb.text('🪑 Низкая', `${prefix}_low`).row()
          .text('🚶 Средняя', `${prefix}_medium`).row()
          .text('🏃 Высокая', `${prefix}_high`).row()
          .text('🏋️ Спортсмен', `${prefix}_athlete`);
    } else {
        kb.text('🪑 Низкая', 'act_low').row()
          .text('🚶 Средняя', 'act_medium').row()
          .text('🏃 Высокая', 'act_high').row()
          .text('🏋️ Спортсмен', 'act_athlete');
    }
    return kb;
}

function goalKeyboard(prefix = null) {
    if (prefix) {
        return new InlineKeyboard()
            .text('🔥 Похудение', `${prefix}_lose`)
            .row()
            .text('⚖️ Поддержание', `${prefix}_maintain`)
            .row()
            .text('💪 Масса', `${prefix}_gain`);
    }
    return new InlineKeyboard()
        .text('🔥 Похудение', 'goal_lose')
        .row()
        .text('⚖️ Поддержание', 'goal_maintain')
        .row()
        .text('💪 Масса', 'goal_gain');
}

function mainMenuButton() {
    return new InlineKeyboard().text('🏠 В главное меню', 'exit_to_menu');
}

function dietRecommendationKeyboard(rec) {
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
        kb.text(label, `diet_${diets[i].id}`);
        if (i % 2 === 1) kb.row();
    }
    kb.row().text('⬅️ В меню', 'back_to_profile_management');
    return kb;
}

function foodMainKeyboard() {
    return new InlineKeyboard()
        .text('📓 Дневник еды', 'food_diary')
        .row()
        .text('📅 Рацион на неделю', 'weekly_rational')
        .row()
        .text('⬅️ Назад', 'back');
}

function weeklyRationalKeyboard() {
    return new InlineKeyboard()
        .text('✨ На неделю', 'create_meal_plan')
        .row()
        .text('🌟 На сегодня', 'create_day_plan')
        .row()
        .text('👁 Посмотреть рацион', 'view_meal_plan')
        .row()
        .text('⬅️ Назад', 'main_food');
}

function budgetKeyboard(currentLevel = null) {
    const kb = new InlineKeyboard();
    const levels = [
        { level: 1, label: '💰 Низкий (эконом)' },
        { level: 2, label: '💰 Средний' },
        { level: 3, label: '💰 Высокий (без ограничений)' }
    ];
    for (const l of levels) {
        let label = l.label;
        if (currentLevel === l.level) label = '✅ ' + label;
        kb.text(label, `set_budget_${l.level}`).row();
    }
    kb.text('⬅️ Отмена', 'weekly_rational');
    return kb;
}

function foodDiaryKeyboard() {
    return new InlineKeyboard()
        .text('➕ Добавить приём пищи', 'add_food_entry')
        .row()
        .text('💧 Добавить воду', 'add_water')
        .row()
        .text('📊 Статистика за сегодня', 'food_stats_today')
        .row()
        .text('⬅️ Назад', 'main_food');
}

function mealTypeKeyboard() {
    return new InlineKeyboard()
        .text('🍳 Завтрак', 'meal_breakfast')
        .text('🍲 Обед', 'meal_lunch')
        .row()
        .text('🍽 Ужин', 'meal_dinner')
        .text('🍎 Перекус', 'meal_snack')
        .row()
        .text('⬅️ Отмена', 'food_diary');
}

function backKeyboard(callback) {
    return new InlineKeyboard().text('⬅️ Назад', callback);
}

function deleteConfirmKeyboard() {
    return new InlineKeyboard()
        .text('✅ Да, удалить', 'profile_delete_confirm')
        .text('❌ Нет, отмена', 'back_to_profile_management');
}

function startCalcKeyboard() {
    return new InlineKeyboard().text('🥗 Рассчитать диету', 'new_calc');
}

function vitaMenuKeyboard() {
    return new InlineKeyboard()
        .text('💬 Начать диалог', 'vita_start_chat')
        .row()
        .text('📜 История диалогов', 'vita_history')
        .row()
        .text('⬅️ Назад', 'back');
}

module.exports = {
    mainMenuKeyboard,
    profileManagementKeyboard,
    editParamsKeyboard,
    genderKeyboard,
    activityKeyboard,
    goalKeyboard,
    dietRecommendationKeyboard,
    foodMainKeyboard,
    weeklyRationalKeyboard,
    budgetKeyboard,
    foodDiaryKeyboard,
    mealTypeKeyboard,
    backKeyboard,
    deleteConfirmKeyboard,
    startCalcKeyboard,
    vitaMenuKeyboard
};