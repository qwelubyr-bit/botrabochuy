const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(
    path.join(__dirname, 'diet.db')
);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    chat_id INTEGER PRIMARY KEY,
    name TEXT,
    gender TEXT,
    age INTEGER,
    height INTEGER,
    weight INTEGER,
    activity TEXT,
    goal TEXT,
    diet_name TEXT,
    diet_type TEXT,
    target_weight INTEGER,
    water_today INTEGER DEFAULT 0,
    step TEXT,
    menu_id INTEGER,
    bmr REAL,
    tdee REAL,
    activity_factor REAL,
    goal_factor REAL,
    calories INTEGER,
    protein INTEGER,
    fat INTEGER,
    carbs INTEGER,
    water_target INTEGER,
    steps_target INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS vita_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vita_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES vita_conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vita_messages_conv ON vita_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_vita_conversations_chat ON vita_conversations(chat_id);
`);


try {
    db.exec(`ALTER TABLE users ADD COLUMN current_vita_conv INTEGER`);
    console.log('✅ Колонка current_vita_conv добавлена');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

try {
    db.exec(`ALTER TABLE users ADD COLUMN steps_today INTEGER DEFAULT 0`);
    console.log('✅ Колонка steps_today добавлена');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

try {
    db.exec(`ALTER TABLE users ADD COLUMN budget_level INTEGER DEFAULT 2`);
    console.log('✅ Колонка budget_level добавлена');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

try {
    db.exec(`ALTER TABLE users ADD COLUMN restrictions TEXT`);
    console.log('✅ Колонка restrictions добавлена');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

try {
    db.exec(`ALTER TABLE users ADD COLUMN active_plan_id INTEGER`);
    console.log('✅ Колонка active_plan_id добавлена');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }


try {
    db.exec(`ALTER TABLE users ADD COLUMN temp_meal_type TEXT`);
    console.log('✅ Колонка temp_meal_type добавлена');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

try {
    db.exec(`ALTER TABLE users ADD COLUMN temp_recipe_name TEXT`);
    console.log('✅ Колонка temp_recipe_name добавлена');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

try {
    db.exec(`ALTER TABLE users ADD COLUMN temp_recipe_category TEXT`);
    console.log('✅ Колонка temp_recipe_category добавлена');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

try {
    db.exec(`ALTER TABLE users ADD COLUMN temp_recipe_calories INTEGER`);
    console.log('✅ Колонка temp_recipe_calories добавлена');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

try {
    db.exec(`ALTER TABLE users ADD COLUMN temp_recipe_protein REAL`);
    console.log('✅ Колонка temp_recipe_protein добавлена');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

try {
    db.exec(`ALTER TABLE users ADD COLUMN temp_recipe_fat REAL`);
    console.log('✅ Колонка temp_recipe_fat добавлена');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

try {
    db.exec(`ALTER TABLE users ADD COLUMN temp_recipe_carbs REAL`);
    console.log('✅ Колонка temp_recipe_carbs добавлена');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

try {
    db.exec(`ALTER TABLE users ADD COLUMN temp_recipe_ingredients TEXT`);
    console.log('✅ Колонка temp_recipe_ingredients добавлена');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }


try {
    db.exec(`ALTER TABLE users ADD COLUMN temp_recipe_grams INTEGER`);
    console.log('✅ Колонка temp_recipe_grams добавлена');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

function getUser(chatId) {
    const user = db
        .prepare(`SELECT * FROM users WHERE chat_id = ?`)
        .get(chatId);
    return user || null;
}

function createUser(chatId) {
    const exists = getUser(chatId);
    if (exists) return exists;
    db.prepare(`INSERT INTO users (chat_id) VALUES (?)`).run(chatId);
    return getUser(chatId);
}

function updateUser(chatId, field, value) {
    const allowedFields = [
        'name', 'gender', 'age', 'height', 'weight', 'activity', 'goal', 'diet_name',
        'step', 'menu_id', 'bmr', 'tdee', 'activity_factor', 'goal_factor', 'calories',
        'protein', 'fat', 'carbs', 'water_target', 'diet_type', 'target_weight',
        'water_today', 'steps_target', 'steps_today', 'budget_level', 'temp_meal_type',
        'active_plan_id', 'current_vita_conv',
        'temp_recipe_name', 'temp_recipe_category', 'temp_recipe_calories',
        'temp_recipe_protein', 'temp_recipe_fat', 'temp_recipe_carbs',
        'temp_recipe_grams',
        'temp_recipe_ingredients',
        'restrictions' 
    ];
    if (!allowedFields.includes(field)) {
        throw new Error(`Поле "${field}" запрещено`);
    }
    db.prepare(`
        UPDATE users
        SET ${field} = ?, updated_at = CURRENT_TIMESTAMP
        WHERE chat_id = ?
    `).run(value, chatId);
    return getUser(chatId);
}

function updateUserCtx(ctx, field, value) {
    const chatId = ctx.chat.id;
    updateUser(chatId, field, value);
    if (ctx.state && ctx.state.user) {
        ctx.state.user[field] = value;
    } else {
        ctx.state = ctx.state || {};
        ctx.state.user = getUser(chatId);
    }
    return ctx.state.user;
}

function saveProfile(chatId, data) {
    createUser(chatId);
    db.prepare(`
        UPDATE users SET
            name = ?, gender = ?, age = ?, height = ?, weight = ?,
            activity = ?, goal = ?, diet_name = ?,
            calories = ?, protein = ?, fat = ?, carbs = ?,
            water_target = ?, steps_target = ?, updated_at = CURRENT_TIMESTAMP
        WHERE chat_id = ?
    `).run(
        data.name || null, data.gender || null, data.age || null,
        data.height || null, data.weight || null, data.activity || null,
        data.goal || null, data.diet_name || null, data.calories || null,
        data.protein || null, data.fat || null, data.carbs || null,
        data.water_target || null, data.steps_target || null, chatId
    );
    return getUser(chatId);
}

function deleteUser(chatId) {
    return db.prepare(`DELETE FROM users WHERE chat_id = ?`).run(chatId);
}

function createVitaConversation(chatId, title = null) {
    const stmt = db.prepare(`
        INSERT INTO vita_conversations (chat_id, title) VALUES (?, ?)
    `);
    const info = stmt.run(chatId, title);
    return info.lastInsertRowid;
}

function getVitaConversations(chatId) {
    return db.prepare(`
        SELECT id, title, created_at FROM vita_conversations
        WHERE chat_id = ? ORDER BY created_at DESC
    `).all(chatId);
}

function getVitaMessages(convId) {
    return db.prepare(`
        SELECT role, content, created_at FROM vita_messages
        WHERE conversation_id = ? ORDER BY id ASC
    `).all(convId);
}

function saveVitaMessage(convId, role, content) {
    const stmt = db.prepare(`
        INSERT INTO vita_messages (conversation_id, role, content) VALUES (?, ?, ?)
    `);
    stmt.run(convId, role, content);
}

function deleteVitaConversation(convId) {
    db.prepare(`DELETE FROM vita_conversations WHERE id = ?`).run(convId);
}

function deleteAllVitaConversations(chatId) {
    db.prepare(`DELETE FROM vita_conversations WHERE chat_id = ?`).run(chatId);
}

function saveMessage(chatId, role, content) {
    db.prepare(`
        INSERT INTO chat_history (chat_id, role, content) VALUES (?, ?, ?)
    `).run(chatId, role, content);
}

function getHistory(chatId, limit = 20) {
    return db.prepare(`
        SELECT role, content FROM chat_history
        WHERE chat_id = ? ORDER BY id DESC LIMIT ?
    `).all(chatId, limit).reverse();
}

function clearHistory(chatId) {
    db.prepare(`DELETE FROM chat_history WHERE chat_id = ?`).run(chatId);
}

function getFullHistory(chatId, limit = 50) {
    return db.prepare(`
        SELECT role, content, datetime(created_at, 'localtime') as created_at
        FROM chat_history WHERE chat_id = ? ORDER BY id DESC LIMIT ?
    `).all(chatId, limit).reverse();
}

function migrateWaterTarget() {
    const usersToFix = db.prepare(`
        SELECT chat_id, weight FROM users
        WHERE water_target IS NULL AND weight IS NOT NULL
    `).all();
    if (usersToFix.length === 0) return;
    console.log(`💧 Migrating water_target for ${usersToFix.length} users...`);
    const updateStmt = db.prepare(`
        UPDATE users SET water_target = ?, updated_at = CURRENT_TIMESTAMP WHERE chat_id = ?
    `);
    for (const user of usersToFix) {
        const waterTarget = Math.round(user.weight * 35);
        updateStmt.run(waterTarget, user.chat_id);
    }
    console.log(`✅ Water_target migrated`);
}
migrateWaterTarget();

function resetProfile(chatId) {
    db.prepare(`
        UPDATE users SET
            name = NULL, gender = NULL, age = NULL, height = NULL, weight = NULL,
            activity = NULL, goal = NULL, diet_name = NULL, diet_type = NULL,
            target_weight = NULL, water_today = 0, step = NULL, menu_id = NULL,
            bmr = NULL, tdee = NULL, activity_factor = NULL, goal_factor = NULL,
            calories = NULL, protein = NULL, fat = NULL, carbs = NULL,
            water_target = NULL, steps_target = NULL, steps_today = 0,
            budget_level = 2, active_plan_id = NULL, current_vita_conv = NULL,
            temp_meal_type = NULL,
            temp_recipe_name = NULL, temp_recipe_category = NULL,
            temp_recipe_calories = NULL, temp_recipe_protein = NULL,
            temp_recipe_fat = NULL, temp_recipe_carbs = NULL,
            temp_recipe_grams = NULL,
            temp_recipe_ingredients = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE chat_id = ?
    `).run(chatId);
    db.prepare(`DELETE FROM chat_history WHERE chat_id = ?`).run(chatId);
    db.prepare(`DELETE FROM meal_plans WHERE chat_id = ?`).run(chatId);
    db.prepare(`DELETE FROM food_log WHERE chat_id = ?`).run(chatId);
    db.prepare(`DELETE FROM water_log WHERE chat_id = ?`).run(chatId);
    db.prepare(`DELETE FROM vita_conversations WHERE chat_id = ?`).run(chatId);
    try { db.prepare(`DELETE FROM user_memory WHERE chat_id = ?`).run(chatId); } catch(e) {}
    return getUser(chatId);
}

db.exec(`
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, category TEXT,
    calories REAL, protein REAL, fat REAL, carbs REAL,
    price_level INTEGER DEFAULT 2, diet_types TEXT
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, category TEXT,
    calories INTEGER, protein REAL, fat REAL, carbs REAL,
    price_level INTEGER DEFAULT 2, diet_types TEXT,
    ingredients TEXT, instructions TEXT
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS meal_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL, week_start DATE,
    budget_level INTEGER, diet_type TEXT, plan_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS food_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL, date DATE,
    meal_type TEXT, product_id INTEGER, grams INTEGER,
    FOREIGN KEY(product_id) REFERENCES products(id)
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS water_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL, date DATE, amount_ml INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

try {
    db.exec(`ALTER TABLE meal_plans ADD COLUMN diet_type TEXT`);
    console.log('✅ Колонка diet_type добавлена в meal_plans');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

try {
    db.exec(`ALTER TABLE recipes ADD COLUMN tags TEXT`);
    console.log('✅ Колонка tags добавлена в recipes');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

try {
    db.exec(`ALTER TABLE recipes ADD COLUMN portion_grams INTEGER DEFAULT 250`);
    console.log('✅ Колонка portion_grams добавлена в recipes');
} catch (e) { if (!e.message.includes('duplicate column name')) console.error(e.message); }

function autoTagRecipes() {
    try { db.exec(`ALTER TABLE recipes ADD COLUMN tags TEXT`); } catch(e) {}
    const recipes = db.prepare(`SELECT id, name, ingredients, category FROM recipes WHERE tags IS NULL OR tags = ''`).all();
    if (recipes.length === 0) {
        console.log('🏷️ Все рецепты уже имеют теги.');
        return;
    }
    console.log(`🏷️ Автоматическая расстановка тегов для ${recipes.length} рецептов...`);
    const updateStmt = db.prepare(`UPDATE recipes SET tags = ? WHERE id = ?`);
    const tagRules = [
        { tag: 'gluten', keywords: ['мук', 'хлеб', 'макарон', 'овсян', 'пшениц', 'глютен', 'паста', 'лапш', 'блин', 'панкейк'] },
        { tag: 'lactose', keywords: ['молок', 'кефир', 'йогурт', 'сыр', 'творог', 'сливк', 'сметан', 'лактоз', 'простокваш', 'ряженк'] },
        { tag: 'nuts', keywords: ['орех', 'миндаль', 'кешью', 'грецк', 'фундук', 'арахис', 'фисташк', 'лесн'] },
        { tag: 'chicken', keywords: ['куриц', 'цыпленок', 'курин'] },
        { tag: 'fish', keywords: ['рыб', 'лосось', 'тунец', 'сёмга', 'семга', 'форель', 'окунь', 'минтай'] },
        { tag: 'seafood', keywords: ['креветк', 'миди', 'кальмар', 'морепродукт', 'осьминог', 'устриц'] },
        { tag: 'pork', keywords: ['свин', 'бекон', 'шпик', 'ветчин'] },
        { tag: 'beef', keywords: ['говяд', 'телят', 'стейк', 'мрамор'] },
        { tag: 'eggs', keywords: ['яйц', 'омлет', 'яичниц'] },
        { tag: 'soy', keywords: ['соев', 'тофу', 'соевый', 'эдамам'] }
    ];
    for (const r of recipes) {
        const tags = new Set();
        const text = (r.name + ' ' + (r.ingredients || '') + ' ' + (r.category || '')).toLowerCase();
        for (const rule of tagRules) {
            for (const kw of rule.keywords) {
                if (text.includes(kw)) {
                    tags.add(rule.tag);
                    break;
                }
            }
        }
        const tagsStr = tags.size ? Array.from(tags).join(',') : '';
        updateStmt.run(tagsStr, r.id);
    }
    console.log(`✅ Теги проставлены для ${recipes.length} рецептов.`);
}
autoTagRecipes();

module.exports = {
    db,
    getUser,
    createUser,
    updateUser,
    updateUserCtx,
    saveProfile,
    deleteUser,
    resetProfile,
    saveMessage,
    getHistory,
    clearHistory,
    getFullHistory,
    createVitaConversation,
    getVitaConversations,
    getVitaMessages,
    saveVitaMessage,
    deleteVitaConversation,
    deleteAllVitaConversations
};