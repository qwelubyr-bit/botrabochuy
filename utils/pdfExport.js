const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function replaceEmojis(text) {
    const emojiMap = {
        '🍽': '(Рацион)',
        '🍳': '(Завтрак)',
        '🍲': '(Обед)',
        '🍎': '(Перекус)',
        '📅': '(День)',
        '🔥': '(Ккал)',
        '🍗': '(Белки)',
        '🥑': '(Жиры)',
        '🍞': '(Углеводы)',
        '✅': '(Готово)',
        '❌': '(Нет)',
        '⚖️': '(Баланс)',
        '📉': '(Похудение)',
        '💪': '(Набор)',
        '💧': '(Вода)',
        '🤖': '(AI)',
        '👤': '(Профиль)',
        '✏️': '(Изменить)',
        '🗑': '(Удалить)',
        '⬅️': '(Назад)',
        '⭐': '(Рекомендуется)',
        '🥗': '(Диета)',
        '📓': '(Дневник)',
        '📊': '(Статистика)',
        '➕': '(Добавить)',
        '💰': '(Бюджет)',
        '✨': '(Создать)',
        '👁': '(Посмотреть)',
        '📖': ''
    };
    let result = text;
    for (const [emoji, replacement] of Object.entries(emojiMap)) {
        result = result.split(emoji).join(replacement);
    }
    return result.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
}

let fontPath = '';
if (process.platform === 'win32') {
    const possiblePaths = [
        'C:\\Windows\\Fonts\\Arial.ttf',
        'C:\\Windows\\Fonts\\arial.ttf',
        'C:\\Windows\\Fonts\\ARIAL.TTF'
    ];
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            fontPath = p;
            break;
        }
    }
} else {
    fontPath = path.join(__dirname, '../assets/fonts/Arial.ttf');
}

const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('📁 Папка temp создана');
}

async function generateMealPlanPDF(plan, user, planDate) {
    const planData = JSON.parse(plan.plan_data);
    const tempFile = path.join(tempDir, `meal_plan_${user.chat_id}_${Date.now()}.pdf`);
    
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        if (fs.existsSync(fontPath)) {
            doc.registerFont('MainFont', fontPath);
            doc.font('MainFont');
        } else {
            console.warn('⚠️ Шрифт Arial не найден, русский текст может отображаться некорректно.');
        }
        
        const stream = fs.createWriteStream(tempFile);
        doc.pipe(stream);
        
        stream.on('finish', () => {
            if (fs.existsSync(tempFile) && fs.statSync(tempFile).size > 0) {
                resolve(tempFile);
            } else {
                reject(new Error('PDF файл не создан или пуст'));
            }
        });
        stream.on('error', reject);
        
        doc.fontSize(20).text(replaceEmojis('Ваш недельный рацион'), { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12);
        doc.text(replaceEmojis(`Пользователь: ${user.name || '—'}`));
        doc.text(replaceEmojis(`Дата: ${planDate}`));
        doc.text(replaceEmojis(`Бюджет: ${plan.budget_level === 1 ? 'Низкий' : plan.budget_level === 2 ? 'Средний' : 'Высокий'}`));
        doc.text(replaceEmojis(`Диета: ${getDietLabelRu(plan.diet_type)}`));
        doc.text(replaceEmojis(`Калорийность в день: ${user.calories} ккал`));
        doc.text(replaceEmojis(`Белки/Жиры/Углеводы: ${user.protein}г / ${user.fat}г / ${user.carbs}г`));
        doc.moveDown();
        
        for (const day of planData) {
            doc.fontSize(16).fillColor('green').text(replaceEmojis(`День: ${day.day}`), { underline: true });
            doc.fillColor('black').fontSize(12);
            
            for (const meal of day.meals) {
                const mealNameRu = {
                    'breakfast': 'Завтрак',
                    'lunch': 'Обед',
                    'dinner': 'Ужин',
                    'snack': 'Перекус'
                }[meal.type] || meal.type;
                
                if (meal.recipe) {
                    doc.text(replaceEmojis(`${mealNameRu}: ${meal.recipe.name}`));
                    doc.fontSize(10).fillColor('gray')
                      .text(replaceEmojis(`   Вес: ${meal.recipe.portion_grams} г | Калории: ${meal.recipe.calories} ккал | Белки: ${meal.recipe.protein}г | Жиры: ${meal.recipe.fat}г | Углеводы: ${meal.recipe.carbs}г`));
                    doc.fillColor('black').fontSize(12);
                } else {
                    doc.text(replaceEmojis(`${mealNameRu}: не найдено`));
                }
            }
            doc.moveDown(0.5);
        }
        
        doc.moveDown();
        doc.fontSize(10).fillColor('gray').text(replaceEmojis('Сгенерировано VitaBalance'), { align: 'center' });
        
        doc.end();
    });
}

function getDietLabelRu(dietType) {
    const labels = {
        'balanced': 'Сбалансированная',
        'lowcarb': 'Низкоуглеводная',
        'keto': 'Кето',
        'vegetarian': 'Вегетарианская',
        'mediterranean': 'Средиземноморская'
    };
    return labels[dietType] || 'Не выбрана';
}

module.exports = { generateMealPlanPDF };