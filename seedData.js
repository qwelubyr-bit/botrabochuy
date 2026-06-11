const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'diet.db'));

db.exec(`DELETE FROM products`);
db.exec(`DELETE FROM recipes`);

const products = [
    { name: "Овсянка", category: "breakfast", calories: 68, protein: 2.4, fat: 1.4, carbs: 12, price_level: 1, diet_types: "balanced,vegetarian,mediterranean" },
    { name: "Гречка", category: "lunch", calories: 132, protein: 4.5, fat: 1.3, carbs: 27, price_level: 1, diet_types: "balanced,vegetarian,mediterranean" },
    { name: "Рис белый", category: "lunch", calories: 130, protein: 2.7, fat: 0.3, carbs: 28, price_level: 1, diet_types: "balanced,vegetarian,mediterranean" },
    { name: "Куриная грудка", category: "lunch", calories: 165, protein: 31, fat: 3.6, carbs: 0, price_level: 1, diet_types: "balanced,lowcarb,keto,mediterranean" },
    { name: "Куриное бедро", category: "lunch", calories: 210, protein: 27, fat: 11, carbs: 0, price_level: 1, diet_types: "balanced,lowcarb,keto,mediterranean" },
    { name: "Яйца", category: "breakfast", calories: 155, protein: 13, fat: 11, carbs: 1.1, price_level: 1, diet_types: "balanced,lowcarb,keto,mediterranean" },
    { name: "Творог 5%", category: "snack", calories: 121, protein: 17, fat: 5, carbs: 1.5, price_level: 1, diet_types: "balanced,lowcarb,keto,vegetarian,mediterranean" },
    { name: "Картофель", category: "lunch", calories: 77, protein: 2, fat: 0.1, carbs: 17, price_level: 1, diet_types: "balanced,vegetarian" },
    { name: "Капуста белокочанная", category: "dinner", calories: 25, protein: 1.3, fat: 0.1, carbs: 5, price_level: 1, diet_types: "balanced,lowcarb,keto,vegetarian,mediterranean" },
    { name: "Морковь", category: "snack", calories: 41, protein: 0.9, fat: 0.2, carbs: 9, price_level: 1, diet_types: "balanced,vegetarian,mediterranean" },
    { name: "Лук репчатый", category: "dinner", calories: 40, protein: 1.1, fat: 0.1, carbs: 9, price_level: 1, diet_types: "balanced,lowcarb,keto,vegetarian,mediterranean" },
    { name: "Свёкла", category: "dinner", calories: 43, protein: 1.6, fat: 0.1, carbs: 9.6, price_level: 1, diet_types: "balanced,vegetarian" },
    { name: "Хлеб ржаной", category: "breakfast", calories: 210, protein: 6.6, fat: 1.2, carbs: 43, price_level: 1, diet_types: "balanced,vegetarian" },
    { name: "Макароны из твёрдых сортов", category: "lunch", calories: 350, protein: 12, fat: 1.5, carbs: 71, price_level: 1, diet_types: "balanced,vegetarian" },
    { name: "Молоко 2.5%", category: "breakfast", calories: 52, protein: 2.8, fat: 2.5, carbs: 4.7, price_level: 1, diet_types: "balanced,vegetarian" },
    { name: "Кефир 1%", category: "snack", calories: 40, protein: 3, fat: 1, carbs: 4, price_level: 1, diet_types: "balanced,vegetarian" },
    { name: "Яблоко", category: "snack", calories: 52, protein: 0.3, fat: 0.2, carbs: 14, price_level: 1, diet_types: "balanced,vegetarian,mediterranean" },
    { name: "Банан", category: "snack", calories: 89, protein: 1.1, fat: 0.3, carbs: 23, price_level: 1, diet_types: "balanced,vegetarian,mediterranean" },
    { name: "Лосось", category: "lunch", calories: 208, protein: 20, fat: 13, carbs: 0, price_level: 2, diet_types: "balanced,lowcarb,keto,mediterranean" },
    { name: "Авокадо", category: "snack", calories: 160, protein: 2, fat: 15, carbs: 8.5, price_level: 2, diet_types: "balanced,lowcarb,keto,vegetarian,mediterranean" },
    { name: "Оливковое масло", category: "dinner", calories: 884, protein: 0, fat: 100, carbs: 0, price_level: 2, diet_types: "balanced,lowcarb,keto,vegetarian,mediterranean" },
    { name: "Сыр твёрдый", category: "snack", calories: 402, protein: 25, fat: 33, carbs: 1.3, price_level: 2, diet_types: "balanced,lowcarb,keto,mediterranean" },
    { name: "Орехи грецкие", category: "snack", calories: 654, protein: 15, fat: 65, carbs: 14, price_level: 2, diet_types: "balanced,lowcarb,keto,vegetarian,mediterranean" },
    { name: "Миндаль", category: "snack", calories: 579, protein: 21, fat: 49, carbs: 22, price_level: 2, diet_types: "balanced,lowcarb,keto,vegetarian,mediterranean" },
    { name: "Киноа", category: "lunch", calories: 120, protein: 4.4, fat: 1.9, carbs: 21, price_level: 2, diet_types: "balanced,vegetarian,mediterranean" },
    { name: "Говядина постная", category: "lunch", calories: 158, protein: 25, fat: 6, carbs: 0, price_level: 2, diet_types: "balanced,lowcarb,keto" },
    { name: "Тунец консервированный", category: "lunch", calories: 116, protein: 23, fat: 1.5, carbs: 0, price_level: 2, diet_types: "balanced,lowcarb,keto,mediterranean" },
    { name: "Батат", category: "lunch", calories: 86, protein: 1.6, fat: 0.1, carbs: 20, price_level: 2, diet_types: "balanced,vegetarian" },
    { name: "Индейка", category: "lunch", calories: 189, protein: 29, fat: 7, carbs: 0, price_level: 2, diet_types: "balanced,lowcarb,keto,mediterranean" },
    { name: "Тофу", category: "lunch", calories: 76, protein: 8, fat: 4.8, carbs: 1.9, price_level: 2, diet_types: "balanced,vegetarian,mediterranean" },
    { name: "Семена чиа", category: "snack", calories: 486, protein: 16.5, fat: 30.7, carbs: 42.1, price_level: 2, diet_types: "balanced,vegetarian,mediterranean" },
    { name: "Красная икра", category: "snack", calories: 270, protein: 32, fat: 15, carbs: 0, price_level: 3, diet_types: "balanced,lowcarb,keto,mediterranean" },
    { name: "Стейк из мраморной говядины", category: "lunch", calories: 291, protein: 24, fat: 21, carbs: 0, price_level: 3, diet_types: "balanced,lowcarb,keto" },
    { name: "Спаржа", category: "dinner", calories: 20, protein: 2.2, fat: 0.1, carbs: 4, price_level: 3, diet_types: "balanced,lowcarb,keto,vegetarian,mediterranean" },
    { name: "Греческий йогурт", category: "snack", calories: 59, protein: 10, fat: 0.4, carbs: 3.6, price_level: 3, diet_types: "balanced,vegetarian,mediterranean" },
    { name: "Сёмга слабосолёная", category: "lunch", calories: 202, protein: 22, fat: 12, carbs: 0, price_level: 3, diet_types: "balanced,lowcarb,keto,mediterranean" },
    { name: "Печень гусиная (фуа-гра)", category: "dinner", calories: 462, protein: 11, fat: 43, carbs: 4, price_level: 3, diet_types: "balanced,lowcarb,keto" },
    { name: "Артишоки", category: "dinner", calories: 47, protein: 3.3, fat: 0.1, carbs: 10.5, price_level: 3, diet_types: "balanced,vegetarian,mediterranean" },
    { name: "Креветки королевские", category: "lunch", calories: 85, protein: 18, fat: 0.8, carbs: 0, price_level: 3, diet_types: "balanced,lowcarb,keto,mediterranean" },
    { name: "Пармезан", category: "snack", calories: 431, protein: 38, fat: 29, carbs: 4, price_level: 3, diet_types: "balanced,lowcarb,keto,mediterranean" },
];

function autoTagRecipe(name, ingredients, category) {
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
    const text = (name + ' ' + (ingredients || '') + ' ' + (category || '')).toLowerCase();
    const tags = new Set();
    for (const rule of tagRules) {
        for (const kw of rule.keywords) {
            if (text.includes(kw)) {
                tags.add(rule.tag);
                break;
            }
        }
    }
    return tags.size ? Array.from(tags).join(',') : '';
}

const recipesRaw = [
    { name: "Овсяная каша с ягодами", category: "breakfast", calories: 320, protein: 10, fat: 6, carbs: 55, price_level: 1, diet_types: "balanced,vegetarian,mediterranean", ingredients: "Овсяные хлопья 50г, молоко/вода 200мл, ягоды 50г, мёд", instructions: "1. Вскипятить молоко/воду. 2. Добавить овсянку, варить 5 минут. 3. Добавить ягоды и мёд.", portion_grams: 250 },
    { name: "Омлет с помидорами", category: "breakfast", calories: 280, protein: 18, fat: 18, carbs: 8, price_level: 1, diet_types: "balanced,lowcarb,keto,vegetarian,mediterranean", ingredients: "Яйца 2 шт, помидор 1 шт, масло 10г, соль", instructions: "1. Взбить яйца. 2. Нарезать помидор. 3. Обжарить помидор, залить яйцами, жарить 3 минуты.", portion_grams: 200 },
    { name: "Сырники", category: "breakfast", calories: 400, protein: 20, fat: 18, carbs: 40, price_level: 1, diet_types: "balanced,vegetarian", ingredients: "Творог 200г, яйцо 1 шт, мука 30г, сахар 20г, масло", instructions: "1. Смешать творог, яйцо, муку, сахар. 2. Сформировать сырники, обжарить.", portion_grams: 150 },
    { name: "Греческий йогурт с орехами", category: "breakfast", calories: 350, protein: 15, fat: 22, carbs: 20, price_level: 2, diet_types: "balanced,vegetarian,mediterranean", ingredients: "Греческий йогурт 150г, грецкие орехи 30г, мёд", instructions: "Смешать йогурт, орехи и мёд.", portion_grams: 200 },
    { name: "Рисовая каша на молоке", category: "breakfast", calories: 280, protein: 7, fat: 5, carbs: 50, price_level: 1, diet_types: "balanced,vegetarian", ingredients: "Рис круглый 50г, молоко 200мл, сахар 10г", instructions: "Сварить рис на молоке до готовности.", portion_grams: 250 },
    { name: "Бутерброд с авокадо и яйцом", category: "breakfast", calories: 350, protein: 14, fat: 22, carbs: 25, price_level: 2, diet_types: "balanced,vegetarian,mediterranean", ingredients: "Хлеб цельнозерновой 2 куска, авокадо 50г, яйцо 1 шт", instructions: "Размять авокадо, выложить на хлеб, сверху варёное яйцо.", portion_grams: 150 },
    { name: "Яичница с беконом", category: "breakfast", calories: 400, protein: 20, fat: 30, carbs: 2, price_level: 2, diet_types: "balanced,lowcarb,keto", ingredients: "Яйца 2 шт, бекон 50г, соль, перец", instructions: "Обжарить бекон, разбить яйца, жарить 2 минуты.", portion_grams: 180 },
    { name: "Панкейки на кефире", category: "breakfast", calories: 450, protein: 12, fat: 15, carbs: 65, price_level: 1, diet_types: "balanced,vegetarian", ingredients: "Кефир 200мл, мука 150г, яйцо 1 шт, сахар, сода", instructions: "1. Смешать ингредиенты. 2. Жарить на сковороде до румяности.", portion_grams: 200 },
    { name: "Гречка с курицей", category: "lunch", calories: 550, protein: 35, fat: 15, carbs: 65, price_level: 1, diet_types: "balanced", ingredients: "Гречка 80г, куриное филе 150г, морковь, лук, масло", instructions: "1. Отварить гречку. 2. Обжарить курицу с овощами. 3. Смешать.", portion_grams: 300 },
    { name: "Рис с тунцом и огурцом", category: "lunch", calories: 520, protein: 28, fat: 12, carbs: 70, price_level: 2, diet_types: "balanced,mediterranean", ingredients: "Рис 80г, тунец консервированный 100г, огурец 80г, соевый соус", instructions: "Отварить рис. Нарезать огурец. Смешать с тунцом и соусом.", portion_grams: 280 },
    { name: "Суп куриный с лапшой", category: "lunch", calories: 380, protein: 25, fat: 10, carbs: 45, price_level: 1, diet_types: "balanced", ingredients: "Куриное бедро 200г, лапша 50г, картофель, морковь, лук", instructions: "Сварить бульон, добавить овощи и лапшу, варить 20 минут.", portion_grams: 350 },
    { name: "Запечённая рыба с картофелем", category: "lunch", calories: 500, protein: 35, fat: 18, carbs: 50, price_level: 2, diet_types: "balanced,mediterranean", ingredients: "Филе рыбы 150г, картофель 150г, сметана, специи", instructions: "Запечь рыбу и картофель в духовке 25 минут.", portion_grams: 320 },
    { name: "Паста с томатным соусом и фрикадельками", category: "lunch", calories: 620, protein: 30, fat: 20, carbs: 75, price_level: 2, diet_types: "balanced", ingredients: "Паста 80г, фарш куриный 100г, томаты, лук, морковь", instructions: "Сварить пасту. Сделать фрикадельки, потушить в томатном соусе.", portion_grams: 350 },
    { name: "Киноа с овощами и нутом", category: "lunch", calories: 480, protein: 18, fat: 12, carbs: 70, price_level: 2, diet_types: "balanced,vegetarian,mediterranean", ingredients: "Киноа 80г, нут 100г, перец, цукини, оливковое масло", instructions: "Отварить киноа и нут. Обжарить овощи, смешать.", portion_grams: 300 },
    { name: "Плов из курицы", category: "lunch", calories: 600, protein: 32, fat: 18, carbs: 75, price_level: 1, diet_types: "balanced", ingredients: "Рис 80г, куриное бедро 150г, морковь, лук, специи", instructions: "1. Обжарить курицу с овощами. 2. Добавить рис и воду, тушить до готовности.", portion_grams: 350 },
    { name: "Говядина тушёная с гречкой", category: "lunch", calories: 580, protein: 40, fat: 20, carbs: 55, price_level: 2, diet_types: "balanced", ingredients: "Говядина 150г, гречка 80г, лук, морковь, томатная паста", instructions: "1. Отварить гречку. 2. Потушить говядину с овощами. 3. Смешать.", portion_grams: 320 },
    { name: "Лосось с киноа и спаржей", category: "lunch", calories: 650, protein: 38, fat: 28, carbs: 45, price_level: 3, diet_types: "balanced,mediterranean", ingredients: "Лосось 150г, киноа 80г, спаржа 100г, оливковое масло", instructions: "1. Запечь лосось. 2. Отварить киноа. 3. Бланшировать спаржу. 4. Полить маслом.", portion_grams: 330 },
    { name: "Куриные котлеты с пюре", category: "lunch", calories: 550, protein: 35, fat: 22, carbs: 50, price_level: 1, diet_types: "balanced", ingredients: "Фарш куриный 150г, картофель 200г, яйцо, лук, сухари", instructions: "1. Сделать котлеты, обжарить. 2. Сварить пюре.", portion_grams: 350 },
    { name: "Томатный суп с базиликом", category: "lunch", calories: 250, protein: 6, fat: 12, carbs: 30, price_level: 1, diet_types: "balanced,vegetarian", ingredients: "Помидоры 400г, лук, чеснок, базилик, оливковое масло", instructions: "1. Обжарить лук и чеснок. 2. Добавить помидоры, тушить. 3. Пюрировать, добавить базилик.", portion_grams: 300 },
    { name: "Запечённая курица с брокколи", category: "dinner", calories: 450, protein: 40, fat: 22, carbs: 15, price_level: 1, diet_types: "balanced,lowcarb,keto", ingredients: "Куриное филе 200г, брокколи 150г, сыр 30г, специи", instructions: "Запечь курицу 25 мин. Брокколи отварить. Посыпать сыром, запечь ещё 5 мин.", portion_grams: 320 },
    { name: "Овощной салат с тунцом", category: "dinner", calories: 320, protein: 25, fat: 18, carbs: 15, price_level: 1, diet_types: "balanced,lowcarb,keto,mediterranean", ingredients: "Тунец 100г, салат, помидоры черри, огурец, масло", instructions: "Нарезать овощи, добавить тунец, заправить маслом.", portion_grams: 250 },
    { name: "Говядина по-строгановски", category: "dinner", calories: 580, protein: 45, fat: 30, carbs: 25, price_level: 2, diet_types: "balanced", ingredients: "Говядина 200г, сметана 50г, лук, мука, масло", instructions: "Нарезать говядину соломкой, обжарить. Добавить лук, муку, сметану, тушить 10 минут.", portion_grams: 300 },
    { name: "Рыбные котлеты с пюре", category: "dinner", calories: 530, protein: 30, fat: 25, carbs: 45, price_level: 2, diet_types: "balanced", ingredients: "Филе рыбы 200г, картофель 200г, яйцо, лук, сухари", instructions: "Сделать фарш, сформировать котлеты, обжарить. Сварить пюре.", portion_grams: 350 },
    { name: "Творожная запеканка", category: "dinner", calories: 350, protein: 25, fat: 12, carbs: 35, price_level: 1, diet_types: "balanced,vegetarian", ingredients: "Творог 200г, яйцо 2 шт, манка 30г, сахар", instructions: "Смешать, выложить в форму, запечь 30 минут.", portion_grams: 200 },
    { name: "Куриные котлеты с гречкой", category: "dinner", calories: 500, protein: 38, fat: 18, carbs: 45, price_level: 1, diet_types: "balanced", ingredients: "Куриный фарш 200г, гречка 80г, яйцо, лук", instructions: "Смешать фарш с луком и яйцом, сформировать котлеты. Отварить гречку.", portion_grams: 320 },
    { name: "Тушёная капуста с курицей", category: "dinner", calories: 350, protein: 25, fat: 12, carbs: 30, price_level: 1, diet_types: "balanced,lowcarb", ingredients: "Куриное филе 150г, капуста 200г, морковь, лук, томатная паста", instructions: "Обжарить курицу, добавить овощи, тушить 20 минут.", portion_grams: 280 },
    { name: "Стейк из индейки с овощами на гриле", category: "dinner", calories: 420, protein: 40, fat: 18, carbs: 20, price_level: 2, diet_types: "balanced,lowcarb,keto,mediterranean", ingredients: "Индейка 200г, кабачок, перец, баклажан, оливковое масло", instructions: "Замариновать индейку, пожарить на гриле. Овощи также запечь.", portion_grams: 300 },
    { name: "Рататуй", category: "dinner", calories: 180, protein: 4, fat: 10, carbs: 20, price_level: 1, diet_types: "balanced,vegetarian,mediterranean", ingredients: "Кабачок, баклажан, перец, помидоры, лук, чеснок", instructions: "Нарезать овощи, слоями выложить в форму, запечь 40 минут.", portion_grams: 250 },
    { name: "Яблоко с арахисовой пастой", category: "snack", calories: 200, protein: 5, fat: 10, carbs: 25, price_level: 1, diet_types: "balanced,vegetarian", ingredients: "Яблоко 1 шт, арахисовая паста 15г", instructions: "Намазать пасту на дольки яблока.", portion_grams: 150 },
    { name: "Творог с ягодами", category: "snack", calories: 150, protein: 15, fat: 5, carbs: 12, price_level: 1, diet_types: "balanced,vegetarian,mediterranean", ingredients: "Творог 100г, ягоды 50г, мёд", instructions: "Смешать творог с ягодами и мёдом.", portion_grams: 150 },
    { name: "Греческий йогурт", category: "snack", calories: 100, protein: 10, fat: 0.4, carbs: 12, price_level: 2, diet_types: "balanced,vegetarian,mediterranean", ingredients: "Греческий йогурт 150г", instructions: "Просто съесть.", portion_grams: 150 },
    { name: "Орехово-фруктовая смесь", category: "snack", calories: 250, protein: 6, fat: 18, carbs: 20, price_level: 2, diet_types: "balanced,vegetarian,mediterranean", ingredients: "Орехи 30г, курага 30г, чернослив 30г", instructions: "Смешать сухофрукты и орехи.", portion_grams: 100 },
    { name: "Смузи из шпината и банана", category: "snack", calories: 180, protein: 5, fat: 3, carbs: 35, price_level: 2, diet_types: "balanced,vegetarian,mediterranean", ingredients: "Банан 1 шт, шпинат 50г, йогурт 100г, вода", instructions: "Всё смешать в блендере.", portion_grams: 250 },
    { name: "Морковные палочки с хумусом", category: "snack", calories: 120, protein: 4, fat: 6, carbs: 15, price_level: 2, diet_types: "balanced,vegetarian,mediterranean", ingredients: "Морковь 100г, хумус 50г", instructions: "Нарезать морковь палочками, макать в хумус.", portion_grams: 150 },
    { name: "Протеиновый коктейль", category: "snack", calories: 200, protein: 25, fat: 5, carbs: 15, price_level: 2, diet_types: "balanced,vegetarian", ingredients: "Сывороточный протеин 30г, молоко 200мл, банан 0.5", instructions: "Смешать в блендере.", portion_grams: 300 },
    { name: "Печёное яблоко с корицей", category: "snack", calories: 120, protein: 1, fat: 1, carbs: 30, price_level: 1, diet_types: "balanced,vegetarian,mediterranean", ingredients: "Яблоко 1 шт, корица, мёд", instructions: "Вынуть сердцевину, посыпать корицей, запечь 15 минут.", portion_grams: 180 },
    { name: "Кефир с отрубями", category: "snack", calories: 120, protein: 7, fat: 3, carbs: 18, price_level: 1, diet_types: "balanced,vegetarian", ingredients: "Кефир 200мл, отруби 20г, мёд по вкусу", instructions: "Смешать кефир с отрубями и мёдом.", portion_grams: 220 },
];

const recipes = recipesRaw.map(r => ({
    ...r,
    tags: autoTagRecipe(r.name, r.ingredients, r.category)
}));

const insertProduct = db.prepare(`
    INSERT INTO products (name, category, calories, protein, fat, carbs, price_level, diet_types)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const p of products) {
    insertProduct.run(p.name, p.category, p.calories, p.protein, p.fat, p.carbs, p.price_level, p.diet_types);
}


const insertRecipe = db.prepare(`
    INSERT INTO recipes (name, category, calories, protein, fat, carbs, price_level, diet_types, ingredients, instructions, tags, portion_grams)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const r of recipes) {
    insertRecipe.run(
        r.name, r.category, r.calories, r.protein, r.fat, r.carbs,
        r.price_level, r.diet_types, r.ingredients, r.instructions, r.tags, r.portion_grams
    );
}

console.log(`✅ Добавлено продуктов: ${products.length}, рецептов: ${recipes.length}`);