/**
 * DeepSeek AI 暴躁深海 BOSS 对话服务 (main 进程)
 * 调用 deepseek-chat 模型，生成 <= 15 字的极短、嘲讽/暴躁/搞笑 BOSS 实时台词
 * 内置超时控制与丰富的高能离线兜底台词库
 */

const FALLBACK_TAUNTS = {
    hit: [
        "就这刮痧破炮也想抓本王？！",
        "这点伤害是来给本尊修脚的？",
        "有种往我龙头上打，别挠痒痒！",
        "破炮声吵死龙了，吃我一口龙息！",
        "刮！接着刮！本王龙鳞都不掉一片！",
        "急了急了，打歪了你瞎啊？！",
        "你这网是漏风的吧？笑死本座了！",
        "深海也是你能撒野的地方？！",
        "本大爷的钛合金鳞片硬得很！",
        "就这点火力？给本王当电风扇呢！"
    ],
    score: [
        "涨点分就狂？本王一巴掌拍散你！",
        "区区这点分数，回家喂虾去吧！",
        "分再高也是虚的，看本尊撕碎你！",
        "就凭你这点金币，也想收买大海？",
        "才这点能耐？本王还没认真呢！"
    ],
    enrage: [
        "蝼蚁！彻底激怒本座的下场只有死！",
        "全屏狂暴！我看你怎么躲！",
        "受死吧！见识真正的深渊天灾！",
        "敢伤本王？让你人财两空！"
    ]
};

function getRandomFallback(eventType = 'hit') {
    const list = FALLBACK_TAUNTS[eventType] || FALLBACK_TAUNTS.hit;
    return list[Math.floor(Math.random() * list.length)];
}

async function callDeepSeekTaunt({ bossName = '远古五爪金龙', score = 0, eventType = 'hit', bossHpPercent = 100 } = {}) {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    // 若未配置环境变量则秒级返回离线高能金句
    if (!apiKey) {
        console.log('[AI Boss] No DEEPSEEK_API_KEY found, using offline fallback.');
        return getRandomFallback(eventType);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500); // 3.5秒超时保护

    try {
        const promptEvent = eventType === 'score'
            ? `玩家分数刚突破 ${score}，十分嚣张。`
            : (eventType === 'enrage' ? `你受到重创，剩余血量仅剩 ${bossHpPercent}%，进入狂暴！` : `玩家开炮击中了你的坚硬鳞甲，你剩余血量 ${bossHpPercent}%。`);

        const systemPrompt = `你现在是捕鱼街机游戏里的暴躁、嘴硬、傲慢的深海大BOSS【${bossName}】。玩家正在疯狂向你开炮攻击。
请根据战场情境，立刻回怼玩家一句极短、带有强烈吐槽/嘲讽/暴躁语气的台词。
【铁律】：
1. 必须是纯中文简体，字数绝对不能超过15个字（含标点在内15字以内）！
2. 语言要极尽暴躁、生动、接地气，绝不要机械客套和长篇大论！
3. 不要包含任何英文、引号、括号、前缀或解释，直接输出这句台词！`;

        const userPrompt = `${promptEvent} 玩家当前总分: ${score}。立刻用不超过15个字回怼！`;

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey.trim()}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 35,
                temperature: 1.3
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            console.warn(`[AI Boss] DeepSeek API returned status ${response.status}`);
            return getRandomFallback(eventType);
        }

        const data = await response.json();
        let content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!content) return getRandomFallback(eventType);

        // 去除引号与首尾空格
        content = content.replace(/["'“”‘’「」]/g, '').trim();

        // 严格控制在 15 字以内
        if (content.length > 15) {
            content = content.slice(0, 15);
        }

        console.log(`[AI Boss (${bossName})] Generated Taunt:`, content);
        return content;
    } catch (err) {
        clearTimeout(timeout);
        console.warn('[AI Boss] DeepSeek API call failed or timed out:', err.message);
        return getRandomFallback(eventType);
    }
}

module.exports = {
    callDeepSeekTaunt,
    getRandomFallback
};
