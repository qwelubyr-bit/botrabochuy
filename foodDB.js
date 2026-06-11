const { db } = require('./database');

try {
    db.exec(`ALTER TABLE recipes ADD COLUMN portion_grams INTEGER DEFAULT 250`);
} catch (e) {
    if (!e.message.includes('duplicate column name')) console.error(e.message);
}

try {
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_recipes_category_price ON recipes(category, price_level);
        CREATE INDEX IF NOT EXISTS idx_recipes_diet_types ON recipes(diet_types);
        CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes(tags);
        CREATE INDEX IF NOT EXISTS idx_meal_plans_chat_id ON meal_plans(chat_id);
        CREATE INDEX IF NOT EXISTS idx_food_log_chat_date ON food_log(chat_id, date);
        CREATE INDEX IF NOT EXISTS idx_water_log_chat_date ON water_log(chat_id, date);
    `);
} catch (e) {
    console.error('Ошибка при создании индексов:', e.message);
}

function getProductsByBudget(priceLevel, dietType, limit = 30) {
    let sql = `SELECT * FROM products WHERE price_level <= ?`;
    const params = [priceLevel];
    if (dietType && dietType !== 'balanced') {
        sql += ` AND diet_types LIKE ?`;
        params.push(`%${dietType}%`);
    }
    sql += ` LIMIT ?`;
    params.push(limit);
    return db.prepare(sql).all(...params);
}

function searchProducts(query, limit = 10) {
    const allProducts = db.prepare(`SELECT * FROM products`).all();
    const lowerQuery = query.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(lowerQuery));
    return filtered.slice(0, limit);
}

function searchRecipes(query, limit = 10) {
    const allRecipes = db.prepare(`SELECT * FROM recipes`).all();
    const lowerQuery = query.toLowerCase();
    const filtered = allRecipes.filter(r => r.name.toLowerCase().includes(lowerQuery));
    return filtered.slice(0, limit);
}

function getProductById(id) {
    return db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
}

function getRecipesByBudget(priceLevel, dietType, limit = 30) {
    let sql = `SELECT * FROM recipes WHERE price_level <= ?`;
    const params = [priceLevel];
    if (dietType && dietType !== 'balanced') {
        sql += ` AND diet_types LIKE ?`;
        params.push(`%${dietType}%`);
    }
    sql += ` LIMIT ?`;
    params.push(limit);
    return db.prepare(sql).all(...params);
}

function getRecipeById(id) {
    return db.prepare(`SELECT * FROM recipes WHERE id = ?`).get(id);
}

function getRandomRecipeByCategory(category, priceLevel, dietType, excludeIds = [], restrictions = []) {
    let sql = `SELECT * FROM recipes WHERE category = ? AND price_level <= ?`;
    const params = [category, priceLevel];
    
    if (dietType && dietType !== 'balanced') {
        sql += ` AND diet_types LIKE ?`;
        params.push(`%${dietType}%`);
    }
    
    if (excludeIds.length) {
        sql += ` AND id NOT IN (${excludeIds.map(() => '?').join(',')})`;
        params.push(...excludeIds);
    }
    
    if (restrictions && restrictions.length) {
        for (const tag of restrictions) {
            sql += ` AND (tags NOT LIKE ? OR tags IS NULL)`;
            params.push(`%${tag}%`);
        }
    }
    
    sql += ` ORDER BY RANDOM() LIMIT 1`;
    const stmt = db.prepare(sql);
    return stmt.get(...params);
}

function saveMealPlan(chatId, weekStart, budgetLevel, planData, dietType) {
    const stmt = db.prepare(`
        INSERT INTO meal_plans (chat_id, week_start, budget_level, diet_type, plan_data)
        VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(chatId, weekStart, budgetLevel, dietType, JSON.stringify(planData));
    return info.lastInsertRowid;
}

function getLastMealPlan(chatId) {
    return db.prepare(`
        SELECT * FROM meal_plans
        WHERE chat_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    `).get(chatId);
}

function getAllMealPlans(chatId) {
    return db.prepare(`
        SELECT id, week_start, budget_level, diet_type, plan_data, created_at
        FROM meal_plans
        WHERE chat_id = ?
        ORDER BY created_at DESC
    `).all(chatId);
}

function getMealPlanById(planId) {
    return db.prepare(`SELECT * FROM meal_plans WHERE id = ?`).get(planId);
}

function deleteMealPlan(planId) {
    return db.prepare(`DELETE FROM meal_plans WHERE id = ?`).run(planId);
}

function setActivePlan(chatId, planId) {
    const stmt = db.prepare(`UPDATE users SET active_plan_id = ? WHERE chat_id = ?`);
    stmt.run(planId, chatId);
}

function getActivePlan(chatId) {
    const user = db.prepare(`SELECT active_plan_id FROM users WHERE chat_id = ?`).get(chatId);
    if (!user || !user.active_plan_id) return null;
    return getMealPlanById(user.active_plan_id);
}

function logFood(chatId, date, mealType, productId, grams) {
    const stmt = db.prepare(`
        INSERT INTO food_log (chat_id, date, meal_type, product_id, grams)
        VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(chatId, date, mealType, productId, grams);
}

function getFoodLogForDate(chatId, date) {
    return db.prepare(`
        SELECT f.*, p.name, p.calories, p.protein, p.fat, p.carbs
        FROM food_log f
        JOIN products p ON f.product_id = p.id
        WHERE f.chat_id = ? AND f.date = ?
        ORDER BY f.meal_type, f.id
    `).all(chatId, date);
}

function logWater(chatId, date, amountMl) {
    const stmt = db.prepare(`
        INSERT INTO water_log (chat_id, date, amount_ml)
        VALUES (?, ?, ?)
    `);
    stmt.run(chatId, date, amountMl);
}

function getWaterForDate(chatId, date) {
    const stmt = db.prepare(`
        SELECT SUM(amount_ml) as total_ml FROM water_log
        WHERE chat_id = ? AND date = ?
    `);
    const result = stmt.get(chatId, date);
    return result.total_ml || 0;
}

function getBatchRecipesForWeek(priceLevel, dietType, restrictions, usedIdsMap) {
    const categories = ['breakfast', 'lunch', 'dinner', 'snack'];
    const results = { breakfast: [], lunch: [], dinner: [], snack: [] };
    
    for (const cat of categories) {
        let sql = `
            SELECT id, name, calories, protein, fat, carbs, ingredients, instructions, portion_grams
            FROM recipes 
            WHERE category = ? 
              AND price_level <= ?
        `;
        const params = [cat, priceLevel];

        if (dietType && dietType !== 'balanced') {
            sql += ` AND diet_types LIKE ?`;
            params.push(`%${dietType}%`);
        }

        if (restrictions && restrictions.length) {
            for (const tag of restrictions) {
                sql += ` AND (tags NOT LIKE ? OR tags IS NULL)`;
                params.push(`%${tag}%`);
            }
        }
        
        const excludeIds = usedIdsMap[cat] || [];
        if (excludeIds.length) {
            sql += ` AND id NOT IN (${excludeIds.map(() => '?').join(',')})`;
            params.push(...excludeIds);
        }
        
        sql += ` ORDER BY RANDOM()`;
        
        const stmt = db.prepare(sql);
        const allMatches = stmt.all(...params);
        
        if (allMatches.length === 0 && excludeIds.length > 0) {
            const fallbackSql = sql.replace(/ AND id NOT IN \([^)]+\)/, '');
            const fallbackStmt = db.prepare(fallbackSql);
            const fallbackParams = params.slice(0, params.length - excludeIds.length);
            const fallbackMatches = fallbackStmt.all(...fallbackParams);
            results[cat] = fallbackMatches.slice(0, 7);
        } else {
            results[cat] = allMatches.slice(0, 7);
        }
    }
    
    return results;
}

module.exports = {
    getProductsByBudget,
    searchProducts,
    getProductById,
    getRecipesByBudget,
    getRecipeById,
    getRandomRecipeByCategory,
    getAllMealPlans,
    getMealPlanById,
    deleteMealPlan,
    saveMealPlan,
    getLastMealPlan,
    logFood,
    getFoodLogForDate,
    logWater,
    getWaterForDate,
    setActivePlan,
    getActivePlan,
    searchRecipes,
    getBatchRecipesForWeek
};