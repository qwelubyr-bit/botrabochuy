function calculateGoal(user, goal, dietType = 'balanced') {
    if (!user.weight || !user.height || !user.age) return null;

    let bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age;
    if (user.gender === 'male') bmr += 5;
    else bmr -= 161;

    const activityMap = { low: 1.2, medium: 1.55, high: 1.725, athlete: 1.9 };
    const activity = activityMap[user.activity] || 1.55;
    let tdee = bmr * activity;

    let goalMultiplier = 1;
    let goalText = '';
    let rec = '';
    let protein, fat;

    if (goal === 'lose') {
        goalMultiplier = 0.85;
        tdee *= goalMultiplier;
        goalText = '📉 Похудение';
        protein = user.weight * 2.2;
        fat = user.weight * 0.8;
    } else if (goal === 'maintain') {
        goalText = '⚖️ Поддержание';
        protein = user.weight * 1.8;
        fat = user.weight * 1.0;
    } else {
        goalMultiplier = 1.15;
        tdee *= goalMultiplier;
        goalText = '💪 Набор массы';
        protein = user.weight * 2.0;
        fat = user.weight * 1.0;
    }

    switch (dietType) {
        case 'lowcarb':
            fat = fat * 1.2;
            break;
        case 'keto':
            fat = fat * 1.8;
            protein = protein * 0.9;
            break;
        case 'vegetarian':
            protein = protein * 1.1;
            break;
        case 'mediterranean':
            fat = fat * 0.9;
            break;
    }

    protein = Math.round(protein);
    fat = Math.round(fat);
    const calories = Math.round(tdee);
    let carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
    if (dietType === 'keto') carbs = Math.min(carbs, 30);
    if (carbs < 0) carbs = 0;

    if (goal === 'lose') {
        if (dietType === 'keto') rec = 'Дефицит калорий + контроль кетоза + силовые';
        else if (dietType === 'lowcarb') rec = 'Дефицит калорий + достаточно жиров для энергии';
        else if (dietType === 'vegetarian') rec = 'Дефицит калорий + комбинируйте растительные белки';
        else if (dietType === 'mediterranean') rec = 'Дефицит калорий + полезные жиры и рыба';
        else rec = 'Дефицит калорий + белок + силовые тренировки';
    } else if (goal === 'maintain') {
        if (dietType === 'mediterranean') rec = 'Баланс + омега-3 для сердца';
        else if (dietType === 'vegetarian') rec = 'Баланс + следите за B12 и железом';
        else rec = 'Баланс питания и стабильный вес';
    } else {
        if (dietType === 'vegetarian') rec = 'Профицит калорий + комбинируйте белки (бобовые+зерновые)';
        else if (dietType === 'mediterranean') rec = 'Профицит калорий + полезные жиры и рыба';
        else if (dietType === 'keto') rec = 'Профицит калорий + жиры как топливо';
        else rec = 'Профицит калорий + силовые тренировки';
    }

    const waterTarget = Math.round(user.weight * 35);

    return {
        bmr: Math.round(bmr),
        activity,
        goalMultiplier,
        calories,
        protein,
        fat,
        carbs,
        goalText,
        rec,
        waterTarget
    };
}

module.exports = { calculateGoal };