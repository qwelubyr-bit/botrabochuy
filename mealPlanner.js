const { getRandomRecipeByCategory, getBatchRecipesForWeek } = require('./foodDB');

function selectMealsWithCalorieTarget(mealsConfig, targetCalories, budgetLevel, dietType, usedIds, restrictions) {
    const localUsed = { ...usedIds };
    const selected = [];

    const mealTargets = mealsConfig.map(meal => ({
        type: meal.type,
        desiredCal: Math.round(targetCalories * meal.pct)
    }));

    mealTargets.sort((a, b) => b.desiredCal - a.desiredCal);

    for (const mt of mealTargets) {
        let bestRecipe = null;
        let bestDiff = Infinity;

        for (let attempt = 0; attempt < 10; attempt++) {
            let recipe = null;
            for (let budget = budgetLevel; budget <= 3; budget++) {
                recipe = getRandomRecipeByCategory(
                    mt.type, budget, dietType,
                    localUsed[mt.type] || [],
                    restrictions
                );
                if (recipe) break;
            }
            if (!recipe) break;

            const diff = Math.abs(recipe.calories - mt.desiredCal);
            const tolerance = mt.desiredCal * 0.3;

            if (diff < bestDiff && (diff <= tolerance || bestRecipe === null)) {
                bestDiff = diff;
                bestRecipe = recipe;
            }

            if (diff <= tolerance) break;
        }

        if (!bestRecipe) {
            for (let budget = budgetLevel; budget <= 3; budget++) {
                bestRecipe = getRandomRecipeByCategory(mt.type, budget, dietType, localUsed[mt.type] || [], restrictions);
                if (bestRecipe) break;
            }
        }

        if (bestRecipe) {
            localUsed[mt.type] = [...(localUsed[mt.type] || []), bestRecipe.id];
            selected.push({
                type: mt.type,
                recipe: {
                    id: bestRecipe.id,
                    name: bestRecipe.name,
                    calories: bestRecipe.calories,
                    protein: bestRecipe.protein,
                    fat: bestRecipe.fat,
                    carbs: bestRecipe.carbs,
                    ingredients: bestRecipe.ingredients,
                    instructions: bestRecipe.instructions,
                    portion_grams: bestRecipe.portion_grams
                }
            });
        } else {
            selected.push({ type: mt.type, recipe: null });
        }
    }

    const order = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
    selected.sort((a, b) => (order[a.type] || 0) - (order[b.type] || 0));
    return selected;
}

function generateDailyPlan(user, budgetLevel) {
    const dietType = user.diet_type || 'balanced';
    let restrictions = [];
    if (user.restrictions) {
        try { restrictions = JSON.parse(user.restrictions); } catch(e) {}
    }
    const mealsConfig = [
        { type: 'breakfast', pct: 0.25 },
        { type: 'lunch', pct: 0.35 },
        { type: 'dinner', pct: 0.25 },
        { type: 'snack', pct: 0.15 }
    ];
    const usedIds = { breakfast: [], lunch: [], dinner: [], snack: [] };
    const dayPlan = { day: 'Сегодня', meals: [] };
    const targetCalories = user.calories;
    const selectedMeals = selectMealsWithCalorieTarget(
        mealsConfig, targetCalories, budgetLevel, dietType, usedIds, restrictions
    );
    dayPlan.meals = selectedMeals;
    return dayPlan;
}

function generateWeeklyPlan(user, budgetLevel) {
    const dietType = user.diet_type || 'balanced';
    let restrictions = [];
    if (user.restrictions) {
        try { restrictions = JSON.parse(user.restrictions); } catch(e) {}
    }
    const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    const mealsConfig = [
        { type: 'breakfast', pct: 0.25 },
        { type: 'lunch', pct: 0.35 },
        { type: 'dinner', pct: 0.25 },
        { type: 'snack', pct: 0.15 }
    ];
    const plan = [];
    const targetCalories = user.calories;

    for (const day of weekDays) {
        const usedIds = { breakfast: [], lunch: [], dinner: [], snack: [] };
        const selectedMeals = selectMealsWithCalorieTarget(
            mealsConfig, targetCalories, budgetLevel, dietType, usedIds, restrictions
        );
        plan.push({ day, meals: selectedMeals });
    }
    return plan;
}

module.exports = { generateDailyPlan, generateWeeklyPlan };