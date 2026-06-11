console.log('🚀 Bot starting...');
require('dotenv').config();

const { Bot } = require('grammy');
const bot = new Bot(process.env.BOT_TOKEN);

bot.use(async (ctx, next) => {
    const chatId = ctx.chat?.id;
    if (chatId) {
        if (!ctx.state) ctx.state = {};
        const { getUser } = require('./database');
        ctx.state.user = getUser(chatId);
    }
    await next();
});

const profileHandler = require('./handlers/profileHandler');
const calcHandler = require('./handlers/calcHandler');
const foodHandler = require('./handlers/foodHandler');
const aiHandler = require('./handlers/aiHandler');
const messageHandler = require('./handlers/messageHandler');
const restrictionsHandler = require('./handlers/restrictionsHandler');
const recipesHandler = require('./handlers/recipesHandler');

const { showMainMenu } = require('./utils/helpers');
const { getUser, createUser, updateUser } = require('./database');
const { calculateGoal } = require('./calculator');
const { generatePersonalAdvice } = require('./adviceGenerator');

bot.command('start', async (ctx) => {
    const chatId = ctx.chat.id;
    const { sendMenu } = require('./utils/helpers');
    const { InlineKeyboard } = require('grammy');
    
    const user = ctx.state.user || getUser(chatId);
    const hasProfile = user && user.calories && user.weight && user.height && user.age;
    
    if (!hasProfile) {
        createUser(chatId);
        updateUser(chatId, 'step', 'name');
        ctx.state.user = getUser(chatId);
        return sendMenu(ctx, '👤 Как вас зовут?');
    } else {
        const kb = new InlineKeyboard()
            .text('🔄 Создать новый профиль (старый удалится)', 'confirm_reset_profile')
            .row()
            .text('⬅️ Вернуться в меню', 'back');
        return sendMenu(ctx, '⚠️ У вас уже есть профиль. Вы хотите начать регистрацию заново? Старый профиль будет полностью удалён.', kb);
    }
});

bot.command('menu', showMainMenu);

bot.command('recalc', async (ctx) => {
    const chatId = ctx.chat.id;
    const user = ctx.state.user || getUser(chatId);
    if (!user || !user.diet_type) {
        const { sendMenu } = require('./utils/helpers');
        return sendMenu(ctx, '❌ Сначала выберите диету в главном меню.');
    }
    const result = calculateGoal(user, user.goal, user.diet_type);
    if (!result) return sendMenu(ctx, '❌ Недостаточно данных');
    updateUser(chatId, 'calories', result.calories);
    updateUser(chatId, 'protein', result.protein);
    updateUser(chatId, 'fat', result.fat);
    updateUser(chatId, 'carbs', result.carbs);
    updateUser(chatId, 'water_target', result.waterTarget);
    ctx.state.user = getUser(chatId);
    
    const personalAdvice = generatePersonalAdvice(user, user.diet_type, result);
    const msg = `🔄 Пересчитано на основе вашего текущего веса (${user.weight} кг)\n\n🔥 ${result.calories} ккал\n🍗 ${result.protein} г | 🥑 ${result.fat} г | 🍞 ${result.carbs} г\n\n✨ Советы:\n${personalAdvice}`;
    const { sendMenu } = require('./utils/helpers');
    const { backKeyboard } = require('./keyboards/menuKeyboard');
    return sendMenu(ctx, msg, backKeyboard('back'));
});

bot.use(profileHandler);
bot.use(calcHandler);
bot.use(foodHandler);
bot.use(aiHandler);
bot.use(messageHandler);
bot.use(restrictionsHandler);
bot.use(recipesHandler);

bot.catch(console.error);

(async () => {
    await bot.init();
    await bot.api.deleteWebhook();
    console.log('✅ READY');
    await bot.start({
        drop_pending_updates: true,
        onStart() { console.log('BOT RUNNING'); }
    });
})();