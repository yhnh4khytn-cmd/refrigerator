import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '35mb' }));

// Server-side Gemini initialization
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!apiKey,
    model: 'gemini-3.8-flash',
  });
});

// F1: Analyze Fridge Photos (Multimodal visual recognition)
app.post('/api/analyze-fridge', async (req, res) => {
  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: '請提供至少一張冰箱照片' });
    }

    if (!ai) {
      // Fallback demo mock if API key isn't provided or in offline test mode
      console.warn('GEMINI_API_KEY is not set. Returning smart sample detection.');
      return res.json({
        items: [
          {
            name: '雞蛋',
            quantity: 6,
            unit: '顆',
            category: 'egg_bean',
            confidence: 96,
            boundingBox: { ymin: 40, xmin: 30, ymax: 65, xmax: 60 },
            imageIndex: 0,
            expiryDays: 14,
          },
          {
            name: '板豆腐',
            quantity: 1,
            unit: '盒',
            category: 'egg_bean',
            confidence: 91,
            boundingBox: { ymin: 45, xmin: 62, ymax: 70, xmax: 88 },
            imageIndex: 0,
            expiryDays: 5,
          },
          {
            name: '青花菜',
            quantity: 1,
            unit: '朵',
            category: 'vegetable',
            confidence: 88,
            boundingBox: { ymin: 15, xmin: 20, ymax: 42, xmax: 50 },
            imageIndex: 0,
            expiryDays: 4,
          },
          {
            name: '豬五花肉片',
            quantity: 200,
            unit: '公克',
            category: 'meat_seafood',
            confidence: 84,
            boundingBox: { ymin: 68, xmin: 15, ymax: 90, xmax: 45 },
            imageIndex: 0,
            expiryDays: 3,
          },
          {
            name: '韓式泡菜',
            quantity: 1,
            unit: '罐',
            category: 'condiment',
            confidence: 65, // Below 70% to test "請確認" flag!
            boundingBox: { ymin: 20, xmin: 70, ymax: 45, xmax: 95 },
            imageIndex: 0,
            expiryDays: 30,
          },
        ],
        mergedCount: 0,
        warning: '未檢測到 GEMINI_API_KEY，已啟用預設冰箱辨識示範資料。',
      });
    }

    // Prepare multimodal parts for Gemini
    const contents: any[] = [];
    images.forEach((img: { data: string; mimeType: string }, index: number) => {
      // clean base64 data prefix if present
      const cleanData = img.data.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: img.mimeType || 'image/jpeg',
          data: cleanData,
        },
      });
    });

    contents.push({
      text: `你是一位資深的廚房食材管理與視覺辨識專家。請細心觀察所附的 1 到多張冰箱與層架照片，盤點裡面所有的生鮮食材、蔬果、肉品、蛋豆類、奶製品與醬料。
辨識規則：
1. 食材名稱請使用繁體中文（台灣習慣命名，如：青花菜、高麗菜、板豆腐、梅花肉片、牛番茄、雞蛋、鮮奶、起司片）。
2. 估算數量與單位請使用台灣廚房常用單位（顆、把、塊、盒、條、朵、罐、包、公克）。如果難以計數可用 1。
3. category 分類限定為：'vegetable' (蔬菜), 'meat_seafood' (肉品海鮮), 'egg_bean' (蛋豆製品), 'dairy_drink' (乳品飲料), 'staple' (主食澱粉), 'condiment' (調味醬料), 'other' (其他)。
4. confidence: 0 到 100 的信心分數。若被遮擋或不確定，給低於 70。
5. boundingBox: 在照片中的相對位置百分比（ymin, xmin, ymax, xmax，範圍 0-100）。若有多張照片，註明是第幾張照片的索引 (imageIndex, 0 為第一張)。
6. 若同一食材在多張照片重複出現，請自動合併總數量並記錄。
7. 忽略無關雜物（塑膠袋、保溫盒外殼若看不出內容物則不計，或標示為保鮮盒剩菜）。`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: '食材名稱（繁體中文）' },
                  quantity: { type: Type.NUMBER, description: '估計數量數值' },
                  unit: { type: Type.STRING, description: '計量單位（顆、把、朵、盒、包、塊、罐、公克）' },
                  category: {
                    type: Type.STRING,
                    description: 'vegetable, meat_seafood, egg_bean, dairy_drink, staple, condiment, other',
                  },
                  confidence: { type: Type.NUMBER, description: '辨識信心分數 0-100' },
                  expiryDays: { type: Type.NUMBER, description: '建議保存剩餘天數估算' },
                  imageIndex: { type: Type.NUMBER, description: '來自第幾張照片 (0-based)' },
                  boundingBox: {
                    type: Type.OBJECT,
                    properties: {
                      ymin: { type: Type.NUMBER, description: '頂部 0-100' },
                      xmin: { type: Type.NUMBER, description: '左側 0-100' },
                      ymax: { type: Type.NUMBER, description: '底部 0-100' },
                      xmax: { type: Type.NUMBER, description: '右側 0-100' },
                    },
                    required: ['ymin', 'xmin', 'ymax', 'xmax'],
                  },
                },
                required: ['name', 'quantity', 'unit', 'category', 'confidence'],
              },
            },
            notes: { type: Type.STRING, description: '拍照光線或辨識補充說明' },
          },
          required: ['items'],
        },
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);
    res.json(parsed);
  } catch (err: any) {
    console.error('Error analyzing fridge photo:', err);
    res.status(500).json({
      error: '照片辨識失敗，請檢查網路連線或照片格式',
      details: err.message,
    });
  }
});

// F2 & F3: Recipe Generation (Personalized constraints & dynamic deduction)
app.post('/api/generate-recipes', async (req, res) => {
  try {
    const { inventory, preferences, excludedTitles = [] } = req.body;

    if (!inventory || !Array.isArray(inventory) || inventory.length === 0) {
      return res.status(400).json({ error: '請至少提供一項冰箱食材庫存' });
    }

    const {
      equipment = ['單口瓦斯爐', '電鍋', '微波爐'],
      dietStyle = '一般家常',
      excludedIngredients = [],
      timeLimit = 30,
      servings = 1,
      pantryItems = ['鹽', '黑胡椒', '醬油', '食用油', '蒜頭', '糖'],
    } = preferences || {};

    if (!ai) {
      // Smart offline fallback recipes customized to user inputs
      return res.json({
        recipes: getFallbackRecipes(inventory, equipment, dietStyle, timeLimit, servings, excludedTitles),
      });
    }

    const prompt = `你是頂尖的「清冰箱剩食大廚」，專門為小資族與小家庭解決「冰箱剩料不知煮什麼」的難題。
請根據以下使用者的【冰箱庫存】與【廚房條件限制】，生成 3 道截然不同、美味、極易執行且步驟清晰的剩食料理食譜。

【嚴格硬性限制規約】
1. 烹飪設備限制（絕對不可超標）：只能使用使用者選取的設備：[${equipment.join('、')}]。不可出現烤箱、氣炸鍋或多口爐若使用者未勾選！
2. 排除食材（絕對不可出現）：[${excludedIngredients.join('、') || '無'}]。
3. 時間限制：${timeLimit ? `步驟時間總和必須 ≤ ${timeLimit} 分鐘` : '不限時間'}。
4. 份數：${servings} 人份。
5. 飲食風格：${dietStyle}。
6. 避免重複：絕對不要生成以下已被使用者淘汰的菜色：[${excludedTitles.join('、') || '無'}]。
7. 食材來源規則：每道菜的核心食材 100% 必須來自【冰箱庫存】或【家中常備調味料】。如有少量輔助食材庫存不足，必須在該食材提供【替代食材 substitute】建議（例如：無洋蔥可用蔥段代替）。

【目前冰箱庫存清單】
${inventory.map((i: any) => `- ${i.name}: ${i.quantity} ${i.unit} (類別: ${i.category})`).join('\n')}

【家中常備調味料】
${pantryItems.join('、')}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING, description: '吸引人的菜名（如：香濃泡菜豆腐豬肉煲）' },
                  description: { type: Type.STRING, description: '1-2 句風味特色說明' },
                  timeMinutes: { type: Type.NUMBER, description: '總烹飪分鐘數' },
                  equipment: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '使用的設備清單（必須完全在使用者勾選的設備內）',
                  },
                  dietTags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '特色標籤（如：高蛋白、免開火、10分鐘快煮、低醣）',
                  },
                  difficulty: { type: Type.STRING, description: '新手友善 / 中等 / 快速料理' },
                  caloriesEst: { type: Type.NUMBER, description: '單人份預估大卡' },
                  proteinEst: { type: Type.NUMBER, description: '單人份預估蛋白質 (g)' },
                  ingredients: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: '食材名稱' },
                        quantity: { type: Type.NUMBER, description: '本道菜使用數量數值' },
                        unit: { type: Type.STRING, description: '單位（如：顆、公克、朵、塊、湯匙）' },
                        inInventory: { type: Type.BOOLEAN, description: '是否為冰箱現有庫存' },
                        isPantry: { type: Type.BOOLEAN, description: '是否為常備調味料' },
                        substitute: { type: Type.STRING, description: '若無此材料時可使用的冰箱替代品' },
                      },
                      required: ['name', 'quantity', 'unit', 'inInventory', 'isPantry'],
                    },
                  },
                  steps: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        stepNumber: { type: Type.NUMBER },
                        text: { type: Type.STRING, description: '具體操作步驟說明' },
                        timerMinutes: { type: Type.NUMBER, description: '若此步驟需要等待計時（分），否則為 0' },
                        tip: { type: Type.STRING, description: '大廚小撇步或食安提醒' },
                      },
                      required: ['stepNumber', 'text'],
                    },
                  },
                  chefTips: { type: Type.STRING, description: '主廚剩食巧思與調味建議' },
                },
                required: [
                  'title',
                  'description',
                  'timeMinutes',
                  'equipment',
                  'dietTags',
                  'difficulty',
                  'caloriesEst',
                  'proteinEst',
                  'ingredients',
                  'steps',
                  'chefTips',
                ],
              },
            },
          },
          required: ['recipes'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    // Ensure unique IDs
    if (parsed.recipes) {
      parsed.recipes = parsed.recipes.map((r: any, idx: number) => ({
        ...r,
        id: r.id || `recipe-${Date.now()}-${idx}`,
      }));
    }
    res.json(parsed);
  } catch (err: any) {
    console.error('Error generating recipes:', err);
    res.status(500).json({
      error: '食譜生成失敗，請稍後重試',
      details: err.message,
    });
  }
});

// F3: Dynamic Swap a Single Recipe (with micro-tuning chips or natural language tweak)
app.post('/api/swap-recipe', async (req, res) => {
  try {
    const { inventory, preferences, excludedTitles = [], tuningChip, userPrompt } = req.body;

    const {
      equipment = ['單口瓦斯爐', '電鍋'],
      dietStyle = '一般家常',
      excludedIngredients = [],
      timeLimit = 30,
      servings = 1,
      pantryItems = ['鹽', '黑胡椒', '醬油', '食用油', '蒜頭', '糖'],
    } = preferences || {};

    if (!ai) {
      const fallbackList = getFallbackRecipes(inventory, equipment, dietStyle, timeLimit, servings, excludedTitles);
      return res.json({ recipe: fallbackList[0] || null });
    }

    const tweakDesc = [
      tuningChip ? `使用者指定快捷微調方向：「${tuningChip}」` : '',
      userPrompt ? `使用者自訂微調要求：「${userPrompt}」` : '',
    ]
      .filter(Boolean)
      .join('；');

    const prompt = `你是「清冰箱剩食大廚」。使用者對原本推薦的菜色不滿意，要求換一道新菜！
${tweakDesc ? `【特殊換菜要求】${tweakDesc}` : '請換一道全新的料理搭配。'}

【嚴格硬性限制規約】
1. 設備限制：只能使用 [${equipment.join('、')}]。
2. 排除食材：[${excludedIngredients.join('、') || '無'}]。
3. 嚴禁重複：絕對不可生成這些已被換掉的菜色：[${excludedTitles.join('、') || '無'}]。
4. 時間限制：${timeLimit ? `步驟時間總和必須 ≤ ${timeLimit} 分鐘` : '不限時間'}。
5. 份數：${servings} 人份。
6. 飲食風格：${dietStyle}。
7. 100% 以冰箱庫存與常備調味料為主。

【目前冰箱庫存清單】
${inventory.map((i: any) => `- ${i.name}: ${i.quantity} ${i.unit}`).join('\n')}

【常備調味】
${pantryItems.join('、')}

請生成一道全新、符合要求的精選單道食譜。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipe: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                timeMinutes: { type: Type.NUMBER },
                equipment: { type: Type.ARRAY, items: { type: Type.STRING } },
                dietTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                difficulty: { type: Type.STRING },
                caloriesEst: { type: Type.NUMBER },
                proteinEst: { type: Type.NUMBER },
                ingredients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      quantity: { type: Type.NUMBER },
                      unit: { type: Type.STRING },
                      inInventory: { type: Type.BOOLEAN },
                      isPantry: { type: Type.BOOLEAN },
                      substitute: { type: Type.STRING },
                    },
                    required: ['name', 'quantity', 'unit', 'inInventory', 'isPantry'],
                  },
                },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      stepNumber: { type: Type.NUMBER },
                      text: { type: Type.STRING },
                      timerMinutes: { type: Type.NUMBER },
                      tip: { type: Type.STRING },
                    },
                    required: ['stepNumber', 'text'],
                  },
                },
                chefTips: { type: Type.STRING },
              },
              required: [
                'title',
                'description',
                'timeMinutes',
                'equipment',
                'dietTags',
                'difficulty',
                'caloriesEst',
                'proteinEst',
                'ingredients',
                'steps',
                'chefTips',
              ],
            },
          },
          required: ['recipe'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.recipe) {
      parsed.recipe.id = `recipe-${Date.now()}-swapped`;
    }
    res.json(parsed);
  } catch (err: any) {
    console.error('Error swapping recipe:', err);
    res.status(500).json({ error: '換菜失敗，請重試', details: err.message });
  }
});

// Helper for offline / fallback recipes
function getFallbackRecipes(
  inventory: any[],
  equipment: string[],
  dietStyle: string,
  timeLimit: number | null,
  servings: number,
  excludedTitles: string[] = []
) {
  const invNames = inventory.map((i) => i.name);
  const hasEgg = invNames.some((n) => n.includes('蛋'));
  const hasTofu = invNames.some((n) => n.includes('豆腐') || n.includes('豆'));
  const hasPork = invNames.some((n) => n.includes('豬') || n.includes('肉'));
  const hasBroccoli = invNames.some((n) => n.includes('花菜') || n.includes('菜'));

  const pool = [
    {
      id: 'fb-1',
      title: '黃金滑蛋鮮蔬豆腐燴',
      description: '溫潤滑嫩的高蛋白質快炒，充分利用現有雞蛋與豆腐，暖胃又營養。',
      timeMinutes: 12,
      equipment: equipment.includes('單口瓦斯爐') ? ['單口瓦斯爐'] : [equipment[0] || '微波爐'],
      dietTags: ['高蛋白', '極速 15 分鐘', '蛋奶素友善'],
      difficulty: '新手友善',
      caloriesEst: 320 * servings,
      proteinEst: 22 * servings,
      ingredients: [
        { name: '雞蛋', quantity: 2 * servings, unit: '顆', inInventory: hasEgg, isPantry: false },
        { name: '板豆腐', quantity: 0.5 * servings, unit: '盒', inInventory: hasTofu, isPantry: false, substitute: '豆皮或雞蛋豆腐' },
        { name: '青花菜', quantity: 0.5 * servings, unit: '朵', inInventory: hasBroccoli, isPantry: false, substitute: '高麗菜或蔥花' },
        { name: '醬油', quantity: 1 * servings, unit: '大匙', inInventory: true, isPantry: true },
        { name: '黑胡椒', quantity: 1, unit: '少許', inInventory: true, isPantry: true },
      ],
      steps: [
        { stepNumber: 1, text: '豆腐切小塊，青花菜洗淨切小朵，雞蛋打散備用。', timerMinutes: 0 },
        { stepNumber: 2, text: '鍋內下少許油，先炒香青花菜與豆腐，加入 3 大匙水稍微燜煮 2 分鐘。', timerMinutes: 2, tip: '加蓋燜煮讓蔬菜更快熟透' },
        { stepNumber: 3, text: '淋上醬油調味，轉中小火，均勻淋入打散的蛋液。', timerMinutes: 0 },
        { stepNumber: 4, text: '待蛋液半凝固時輕推鍋底關火，撒上黑胡椒即可起鍋！', timerMinutes: 1, tip: '利用餘溫讓蛋達到滑嫩半熟口感' },
      ],
      chefTips: '蛋液不要炒太久，七八分熟最滑嫩！豆腐用手掰碎比切塊更能吸附湯汁。',
    },
    {
      id: 'fb-2',
      title: '電鍋蒜香肉片蒸鮮蔬',
      description: '免顧火、零油煙！食材層層堆疊入電鍋，肉汁精華完全滲透蔬菜。',
      timeMinutes: 20,
      equipment: equipment.includes('電鍋') ? ['電鍋'] : [equipment[0] || '單口瓦斯爐'],
      dietTags: ['免開火顧爐', '少油低卡', '小資必學'],
      difficulty: '新手友善',
      caloriesEst: 380 * servings,
      proteinEst: 26 * servings,
      ingredients: [
        { name: '豬五花肉片', quantity: 150 * servings, unit: '公克', inInventory: hasPork, isPantry: false, substitute: '雞胸肉或火腿' },
        { name: '青花菜', quantity: 0.5 * servings, unit: '朵', inInventory: hasBroccoli, isPantry: false },
        { name: '蒜頭', quantity: 2 * servings, unit: '瓣', inInventory: true, isPantry: true },
        { name: '醬油', quantity: 1.5 * servings, unit: '大匙', inInventory: true, isPantry: true },
        { name: '香油', quantity: 0.5 * servings, unit: '茶匙', inInventory: true, isPantry: true },
      ],
      steps: [
        { stepNumber: 1, text: '蔬菜鋪於耐熱盤底，上方均勻鋪平豬肉片，撒上拍碎蒜末。', timerMinutes: 0 },
        { stepNumber: 2, text: '淋上醬油與少許香油調味。', timerMinutes: 0 },
        { stepNumber: 3, text: '外鍋放半杯水，按下電鍋開關蒸煮約 12 分鐘至跳起。', timerMinutes: 12, tip: '電鍋跳起後燜 3 分鐘肉質更嫩' },
        { stepNumber: 4, text: '取出拌勻盤底肉汁即可享用！', timerMinutes: 0 },
      ],
      chefTips: '鋪在底層的蔬菜會吸滿肉汁鮮味，完全不需要多餘高湯！',
    },
    {
      id: 'fb-3',
      title: '泡菜嫩豆腐鮮肉鍋',
      description: '酸辣開胃的快手清冰箱暖鍋，濃郁湯頭只要 15 分鐘搞定。',
      timeMinutes: 15,
      equipment: [equipment[0] || '單口瓦斯爐'],
      dietTags: ['開胃爽口', '低醣生酮友善', '剩料救星'],
      difficulty: '新手友善',
      caloriesEst: 350 * servings,
      proteinEst: 24 * servings,
      ingredients: [
        { name: '韓式泡菜', quantity: 100 * servings, unit: '公克', inInventory: invNames.some(n => n.includes('泡菜')), isPantry: false, substitute: '番茄或酸菜' },
        { name: '板豆腐', quantity: 0.5 * servings, unit: '盒', inInventory: hasTofu, isPantry: false },
        { name: '雞蛋', quantity: 1 * servings, unit: '顆', inInventory: hasEgg, isPantry: false },
        { name: '蒜頭', quantity: 2, unit: '瓣', inInventory: true, isPantry: true },
        { name: '醬油', quantity: 1, unit: '茶匙', inInventory: true, isPantry: true },
      ],
      steps: [
        { stepNumber: 1, text: '熱鍋下少許油爆香蒜末，加入泡菜炒出香氣（約 1 分鐘）。', timerMinutes: 1 },
        { stepNumber: 2, text: '倒入 350ml 水煮滾，下豆腐塊小火滾煮 4 分鐘入味。', timerMinutes: 4 },
        { stepNumber: 3, text: '下肉片與蔬菜燙熟，最後打入一顆生雞蛋，關火燜 1 分鐘。', timerMinutes: 2, tip: '泡菜汁本身鹹度夠，醬油最後依口味微調' },
      ],
      chefTips: '泡菜先在油裡炒過，酸味會轉化成深層甘甜，湯頭風味立刻升級！',
    },
  ];

  return pool.filter((r) => !excludedTitles.includes(r.title));
}

// Development vs Production serving
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FridgeChef Server running at http://0.0.0.0:${PORT}`);
});
