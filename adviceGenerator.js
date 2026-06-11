function generatePersonalAdvice(user, dietType, result) {
    const bmi = user.weight / ((user.height / 100) ** 2);
    const advice = [];

    if (result.calories < 1300) {
        advice.push('⚠️ Ваша норма калорий ниже 1300 – не опускайтесь ниже, чтобы не замедлить метаболизм.');
    } else if (result.calories > 3000) {
        advice.push('🍽️ Высокая калорийность – разбивайте еду на 5-6 приёмов для лучшего усвоения.');
    }

    if (user.activity === 'high' || user.activity === 'athlete') {
        advice.push(`💪 При вашей активности белок (${result.protein} г) лучше распределить на 4-5 приёмов по 30-40 г.`);
    } else {
        advice.push(`🍗 Белок: ${result.protein} г. Хорошо съедать порцию после тренировки.`);
    }

    if (dietType === 'keto') {
        advice.push('🥑 Кето: пейте больше воды (2.5-3 л) и добавьте электролиты (соль, магний).');
    } else if (dietType === 'lowcarb') {
        advice.push('🥦 При низкоуглеводной диете ешьте много зелёных овощей для клетчатки.');
    } else if (dietType === 'mediterranean') {
        advice.push('🫒 Оливковое масло, рыба 2-3 раза в неделю, орехи – ваши друзья.');
    } else if (dietType === 'vegetarian') {
        advice.push('🍚 Сочетайте бобовые с зерновыми (рис+фасоль, гречка+нут) для полноценного белка.');
    }

    const waterTarget = Math.round(user.weight * 35);
    advice.push(`💧 Ваша норма воды: ${waterTarget} мл. Пейте стакан перед каждым приёмом пищи.`);

    if (user.gender === 'female' && user.age > 45) {
        advice.push('🌿 После 45 лет добавьте кальций (творог, кунжут, миндаль) и витамин D.');
    }
    if (user.gender === 'male' && user.goal === 'gain') {
        advice.push('🏋️ Для набора массы увеличьте белок в посттренировочный приём (протеин или курица).');
    }

    if (user.goal === 'lose') {
        if (bmi > 32) {
            advice.push('🎯 При высоком ИМТ начинайте с ходьбы (8-10 тыс шагов) и дефицита 300-500 ккал, без экстремальных диет.');
        } else if (bmi < 25 && user.goal === 'lose') {
            advice.push('✨ У вас небольшой вес – дефицит делайте мягким (200-300 ккал) и добавьте силовые, чтобы не терять мышцы.');
        }
    }

    return advice.slice(0, 5).map((a, i) => `${i+1}. ${a}`).join('\n');
}

module.exports = { generatePersonalAdvice };