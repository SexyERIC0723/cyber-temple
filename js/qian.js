/**
 * 赛博寺庙 - 求签页面脚本
 */

// 100支签数据
const fortunes = [
    // 1-10
    {id:1, title:"晨光启程", level:"上上签", text:"新的开始，一切顺利，适合开业、启程、立新目标。"},
    {id:2, title:"稳步起步", level:"上签", text:"脚踏实地，慢慢来就会有收获，忌急于求成。"},
    {id:3, title:"小试牛刀", level:"中签", text:"现在适合先做小规模尝试，边做边调，不宜一口气 All in。"},
    {id:4, title:"贵人初现", level:"上签", text:"身边会出现愿意帮你的人，好好把握合作与社交。"},
    {id:5, title:"云开见日", level:"上上签", text:"之前的卡点会开始松动，适合解决旧问题、翻篇。"},
    {id:6, title:"先难后易", level:"中上签", text:"一开始会比较累，但后面会越来越顺，适合长期项目。"},
    {id:7, title:"三思而行", level:"中签", text:"眼前的选择有坑，务必多问几个人意见再决定。"},
    {id:8, title:"把握当下", level:"上签", text:"机会就在眼前，不过期很快，适合果断出手。"},
    {id:9, title:"静观其变", level:"中签", text:"局势还没定型，先观察，少做大动作为宜。"},
    {id:10, title:"种子之签", level:"上签", text:"今天播下的种子以后才会发芽，现在做的是长期铺垫。"},
    // 11-20
    {id:11, title:"书山有路", level:"上签", text:"学习、备考、进修相关都很有利，多花时间在输入上。"},
    {id:12, title:"勤能补拙", level:"中上签", text:"天赋一般，但努力足够就能追上甚至超过别人。"},
    {id:13, title:"灵感乍现", level:"上签", text:"适合写方案、写文案、做创作，会有好点子。"},
    {id:14, title:"师友相助", level:"上签", text:"容易遇到好的老师、导师、前辈，宜主动请教。"},
    {id:15, title:"名在后头", level:"中签", text:"暂时看不到成绩，但不要灰心，结果会迟到不会缺席。"},
    {id:16, title:"换道超车", level:"上签", text:"不必死磕原来的路，可以考虑换专业、换赛道。"},
    {id:17, title:"心魔自退", level:"中上签", text:"焦虑与自我怀疑会慢慢减弱，多做比多想更重要。"},
    {id:18, title:"考运不差", level:"中签", text:"考试有发挥空间，准备到位就能稳定发挥。"},
    {id:19, title:"临阵磨枪", level:"中下签", text:"临时抱佛脚也能有一点效果，但远不如提前准备。"},
    {id:20, title:"放下执念", level:"中签", text:"有些目标是为了面子而不是你真想要，适合重新审视方向。"},
    // 21-30
    {id:21, title:"意外之财", level:"上签", text:"有小偏财运，适合顺手尝试小额机会，不宜重注。"},
    {id:22, title:"水到渠成", level:"上上签", text:"之前铺垫很久的项目、合作、KPI 开始要兑现了。"},
    {id:23, title:"谨慎投资", level:"中签", text:"项目有机会但风险也大，务必分散、控制仓位。"},
    {id:24, title:"账本清明", level:"上签", text:"适合做财务整理、结算、清账，方便后面大动作。"},
    {id:25, title:"飞来横祸", level:"下签", text:"注意破财、罚款、意外支出，谨防合同与条款漏洞。"},
    {id:26, title:"稳中有升", level:"中上签", text:"收益不会暴涨但会稳步增加，适合长期持有。"},
    {id:27, title:"人情账重", level:"中下签", text:"人情往来会吃掉很多时间和钱，注意设边界。"},
    {id:28, title:"合作生财", level:"上签", text:"适合合伙做事，比单打独斗更容易成局。"},
    {id:29, title:"投机勿贪", level:"中签", text:"短线操作可以试试，但要记住有赚就走。"},
    {id:30, title:"知足常乐", level:"中上签", text:"适合锁定阶段性成果，不必追求最后一块肉。"},
    // 31-40
    {id:31, title:"良缘在前", level:"上签", text:"单身者有机会遇到靠谱对象，宜多参加线下活动。"},
    {id:32, title:"旧情复燃", level:"中签", text:"过去的人可能重新出现，要问清楚自己还要不要。"},
    {id:33, title:"有缘无分", level:"下签", text:"心动不一定能走到最后，学会体面转身。"},
    {id:34, title:"坦诚沟通", level:"上签", text:"有误会时，聊清楚就能解开，大胆说出真实感受。"},
    {id:35, title:"先独立", level:"中上签", text:"关系问题很多都源于自己没活好，先照顾好自己。"},
    {id:36, title:"烂桃花退", level:"中签", text:"不合适的人会慢慢淡出，别再心软留后门。"},
    {id:37, title:"朋友即贵人", level:"上签", text:"身边朋友中藏着关键助力，多维护真心关系。"},
    {id:38, title:"适合表白", level:"上签", text:"适合说出心意，比起犹豫，清楚更重要。"},
    {id:39, title:"冷静期", level:"中签", text:"争吵后双方都需要一点时间冷静，不宜强行解决。"},
    {id:40, title:"关系升级", level:"上上签", text:"暧昧可转正，合作可签约，友情可变成更深层的互相扶持。"},
    // 41-50
    {id:41, title:"家和万事兴", level:"上签", text:"家庭氛围改善，适合多陪伴家人、解决旧矛盾。"},
    {id:42, title:"断舍离", level:"中上签", text:"适合大扫除、清理物品、人际与旧念头，让生活轻一点。"},
    {id:43, title:"劳逸失衡", level:"中下签", text:"最近容易过度辛苦或熬夜，提醒你要注意身体。"},
    {id:44, title:"饮食有节", level:"中签", text:"胃口不错但别乱吃，适合调整饮食习惯。"},
    {id:45, title:"小病小灾", level:"中下签", text:"注意感冒、过敏、旧疾复发，早点预防、多休息。"},
    {id:46, title:"搬家宜顺", level:"上签", text:"搬家、换宿舍、换办公室都相对顺利。"},
    {id:47, title:"养成好习惯", level:"上签", text:"此时最适合开始一个新习惯，例如早睡、运动、记账。"},
    {id:48, title:"宠物之福", level:"中上签", text:"适合收养/照顾小动物，能带来疗愈与好运。"},
    {id:49, title:"父母之心", level:"中签", text:"多关注长辈健康与情绪，一通电话胜过很多礼物。"},
    {id:50, title:"生活升级", level:"上签", text:"可以考虑添置一些提升生活质量的小东西，而不是盲目消费。"},
    // 51-60
    {id:51, title:"出行顺利", level:"上签", text:"旅行、差旅、短途出门都比较顺，适合说走就走。"},
    {id:52, title:"路上有险", level:"中下签", text:"出行要注意交通安全、行程延误，预留富余时间。"},
    {id:53, title:"远方来信", level:"中上签", text:"会收到远方或线上传来的好消息、邀请、通知。"},
    {id:54, title:"换环境", level:"上签", text:"换城市、换学校、换公司都有正面意义。"},
    {id:55, title:"按兵不动", level:"中签", text:"现在不太适合大迁移，先稳住阵地比较好。"},
    {id:56, title:"峰回路转", level:"上签", text:"看似走到死胡同，其实前面还有转机。"},
    {id:57, title:"迷路之签", level:"中下签", text:"方向感不强，容易被别人的意见带着走，提醒你回到初心。"},
    {id:58, title:"旅途桃花", level:"中上签", text:"出行时有机会遇到让你眼前一亮的人。"},
    {id:59, title:"人走茶未凉", level:"中签", text:"离开原有环境后，仍保留几段真正的情谊。"},
    {id:60, title:"转机在外", level:"上签", text:"机会在外面而不是原地，适合主动迈出舒适圈。"},
    // 61-70
    {id:61, title:"心如止水", level:"上签", text:"情绪趋于稳定，适合做长期规划与重要决定。"},
    {id:62, title:"选择困难", level:"中签", text:"会面临多选一，很难两全，其实选定一条路就好。"},
    {id:63, title:"看清真相", level:"中上签", text:"一些粉饰太平的东西会被拆穿，有利于你做真实的决定。"},
    {id:64, title:"自我疗愈", level:"上签", text:"适合休息、自省、写日记、冥想，把自己修补好。"},
    {id:65, title:"执念太深", level:"中下签", text:"对某件事过于执着，反而被它拖住脚步。"},
    {id:66, title:"破圈而出", level:"上签", text:"打破别人对你的固有印象，尝试新标签、新形象。"},
    {id:67, title:"旧梦难圆", level:"下签", text:"有些从前的梦想已经不符合现在的你，放手才有新生。"},
    {id:68, title:"随缘最好", level:"中签", text:"不是不努力，而是不强求眼前这一个结果。"},
    {id:69, title:"信念之光", level:"上上签", text:"只要坚守底层价值观，暂时的输赢都不重要。"},
    {id:70, title:"逆风而行", level:"中上签", text:"现在向前会很辛苦，但方向是对的，坚持有回报。"},
    // 71-80
    {id:71, title:"口舌是非", level:"中下签", text:"容易被误解或卷入八卦，少评论他人是非。"},
    {id:72, title:"人心难测", level:"下签", text:"慎防背后捅刀，合同、钱、权限最好写清楚。"},
    {id:73, title:"计划打折", level:"中签", text:"进度会比预期慢，留有弹性避免自我焦虑。"},
    {id:74, title:"逆水行舟", level:"中上签", text:"不进则退的阶段，需要持续用力，稍懈怠就会被甩开。"},
    {id:75, title:"好事多磨", level:"中签", text:"要成的事会被各种小问题打断，但最终能办成。"},
    {id:76, title:"孤军奋战", level:"中下签", text:"目前阶段依靠外援不多，主要靠自己撑住局面。"},
    {id:77, title:"旧账翻出", level:"下签", text:"过去没解决的问题、没说清的话，会被重新翻出来。"},
    {id:78, title:"危中有机", level:"中上签", text:"表面是坏消息，但转个角度看，可能是倒逼转型的契机。"},
    {id:79, title:"及时止损", level:"中签", text:"适合砍掉亏损项目、人际或消费习惯，减负才能继续前进。"},
    {id:80, title:"清醒之签", level:"上签", text:"你会比以往更清醒地看到谁值得、什么值得，从而做出干脆选择。"},
    // 81-90
    {id:81, title:"柳暗花明", level:"上上签", text:"绝处逢生，关键时刻会有明显转机。"},
    {id:82, title:"声名渐起", level:"上签", text:"适合曝光、发作品、运营账号，会慢慢积累影响力。"},
    {id:83, title:"厚积薄发", level:"上签", text:"之前的积累终于要体现价值，不必再妄自菲薄。"},
    {id:84, title:"功成名就", level:"上上签", text:"阶段性大成果，可获得认可、奖励、offer 或红利。"},
    {id:85, title:"水落石出", level:"中上签", text:"真相浮出水面，公道自在人心。"},
    {id:86, title:"喜忧参半", level:"中签", text:"有好结果也有代价，要接受有得必有失。"},
    {id:87, title:"翻盘之机", level:"上签", text:"即使现在局面不好，仍然存在翻盘的空间。"},
    {id:88, title:"收尾阶段", level:"上签", text:"适合结算、交稿、收尾，把事情完整结束。"},
    {id:89, title:"功不唐捐", level:"中上签", text:"就算结果不完美，你的努力也会在别处回报。"},
    {id:90, title:"重新定义", level:"上签", text:"别人眼中的你会被重新认识，你开始写新的个人人设。"},
    // 91-100
    {id:91, title:"缘尽缘起", level:"中上签", text:"一段缘分要告一段落，新的缘分也在路上。"},
    {id:92, title:"从头再来", level:"中签", text:"某个项目可能需要推翻重做，但这次会做得更好。"},
    {id:93, title:"因果分明", level:"中签", text:"现在的局面，多是过去选择的自然结果，好坏都要坦然接收。"},
    {id:94, title:"清账闭环", level:"上签", text:"适合清债、断联、删好友、取消订阅，把人生列表归零一批。"},
    {id:95, title:"静待花开", level:"中上签", text:"暂时没什么大事件发生，是可以安心休养的空窗期。"},
    {id:96, title:"破旧立新", level:"上签", text:"打破旧制度、旧规则，会带来阵痛但方向正确。"},
    {id:97, title:"放过自己", level:"上签", text:"别再跟过去那个人/那件事较劲，学会原谅自己。"},
    {id:98, title:"大梦初醒", level:"中上签", text:"从一场幻觉里醒来，看清现实后，反而走得更稳。"},
    {id:99, title:"圆满谢幕", level:"上签", text:"一个阶段优雅收尾，不必拖泥带水，适合好聚好散。"},
    {id:100, title:"归零重启", level:"上上签", text:"这不是结束，而是人生新章节的起点，一切可以重来一次。"}
];

// 生成金粉粒子
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.classList.add('sparkle');
        p.style.left = Math.random() * 100 + 'vw';
        p.style.top = Math.random() * 100 + 'vh';
        p.style.width = Math.random() * 3 + 1 + 'px';
        p.style.height = p.style.width;
        p.style.opacity = Math.random();
        p.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(p);
    }
}

let isShaking = false;

function startShake() {
    if (isShaking) return;
    isShaking = true;

    const btn = document.getElementById('shakeBtn');
    const img = document.getElementById('bucketImg');
    const animStick = document.getElementById('animStick');
    
    // 按钮禁用状态
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    btn.querySelector('span').innerText = "感應中...";

    // 1. 开始图片摇晃动画
    img.classList.remove('animate-[float_4s_ease-in-out_infinite]');
    img.classList.add('is-shaking');

        // 重置飛出的籤
    animStick.style.display = 'none';
    animStick.style.top = '40px';
    animStick.style.transform = 'translateX(-50%) rotate(0deg) scale(1)';
    animStick.style.opacity = '1';

    // 2. 摇晃 2秒后
    setTimeout(() => {
        img.classList.remove('is-shaking');
        img.classList.add('animate-[float_4s_ease-in-out_infinite]');

        // 3. 抽取结果
        const randomId = Math.floor(Math.random() * 100) + 1;
        const result = fortunes.find(f => f.id === randomId);

        // 4. 籤飛出動畫
        animStick.style.display = 'block';
        document.getElementById('animStickText').innerText = `第${randomId}籤`;
        
        // 强制重绘
        void animStick.offsetWidth;

        animStick.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        animStick.style.top = '-180px';
        animStick.style.transform = 'translateX(-50%) scale(1.1) rotate(5deg)';
        animStick.style.zIndex = '20';

        // 5. 显示结果弹窗
        setTimeout(() => {
            showResult(result);
            
            // 恢复按钮
            isShaking = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.querySelector('span').innerText = "誠心搖籤";
            
            // 隱藏籤，為下次準備
            animStick.style.opacity = '0';
        }, 1000);

    }, 2000);
}

function showResult(data) {
    const overlay = document.getElementById('resultOverlay');
    const card = document.getElementById('fortuneCard');

    // 填充數據
    document.getElementById('resNumber').innerText = `第 ${data.id} 籤`;
    document.getElementById('resTitle').innerText = data.title;
    document.getElementById('resLevel').innerText = data.level;
    document.getElementById('resText').innerText = data.text;

    overlay.classList.remove('hidden');
    void overlay.offsetWidth;
    overlay.classList.remove('opacity-0');
    card.classList.remove('scale-95');
    card.classList.add('scale-100');
}

function closeResult() {
    const overlay = document.getElementById('resultOverlay');
    const card = document.getElementById('fortuneCard');
    
    overlay.classList.add('opacity-0');
    card.classList.remove('scale-100');
    card.classList.add('scale-95');
    
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 500);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
});
