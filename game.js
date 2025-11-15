// 游戏状态
let gameState = {
    difficulty: 'medium',
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    timer: 0,
    timerInterval: null,
    isProcessing: false,
    gameStarted: false,
    isPreviewing: false
};

// 卡片图案（使用emoji）
const cardSymbols = [
    '🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎹', '🎺',
    '🎻', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎲',
    '🧩', '🎰', '🎳', '🎣'
];

// 难度配置
const difficultyConfig = {
    easy: { rows: 3, cols: 4, pairs: 6 },
    medium: { rows: 4, cols: 4, pairs: 8 },
    hard: { rows: 4, cols: 5, pairs: 10 }
};

// DOM元素
const difficultySelector = document.getElementById('difficulty-selector');
const gameContainer = document.getElementById('game-container');
const gameBoard = document.getElementById('game-board');
const timerDisplay = document.getElementById('timer');
const movesDisplay = document.getElementById('moves');
const matchesDisplay = document.getElementById('matches');
const totalPairsDisplay = document.getElementById('total-pairs');
const victoryModal = document.getElementById('victory-modal');
const hintMessage = document.getElementById('hint-message');

// 难度选择按钮
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const difficulty = btn.dataset.difficulty;
        startGame(difficulty);
    });
});

// 重新开始按钮
document.getElementById('restart-btn').addEventListener('click', () => {
    startGame(gameState.difficulty);
});

// 返回按钮
document.getElementById('back-btn').addEventListener('click', () => {
    resetGame();
    gameContainer.classList.add('hidden');
    difficultySelector.classList.remove('hidden');
});

// 再玩一次按钮
document.getElementById('play-again-btn').addEventListener('click', () => {
    victoryModal.classList.add('hidden');
    startGame(gameState.difficulty);
});

// 更换难度按钮
document.getElementById('change-difficulty-btn').addEventListener('click', () => {
    victoryModal.classList.add('hidden');
    gameContainer.classList.add('hidden');
    difficultySelector.classList.remove('hidden');
    resetGame();
});

// 开始游戏
function startGame(difficulty) {
    resetGame();
    gameState.difficulty = difficulty;
    const config = difficultyConfig[difficulty];

    // 显示游戏容器
    difficultySelector.classList.add('hidden');
    gameContainer.classList.remove('hidden');

    // 设置游戏板网格
    gameBoard.className = 'game-board';
    gameBoard.classList.add(`grid-${config.rows}x${config.cols}`);

    // 创建卡片
    createCards(config.pairs);

    // 更新显示
    totalPairsDisplay.textContent = config.pairs;
    updateDisplay();

    // 显示卡片预览
    showCardsPreview();
}

// 创建卡片
function createCards(pairs) {
    // 选择图案
    const selectedSymbols = cardSymbols.slice(0, pairs);
    const cardPairs = [...selectedSymbols, ...selectedSymbols];

    // 洗牌
    shuffleArray(cardPairs);

    // 创建卡片DOM元素
    gameBoard.innerHTML = '';
    gameState.cards = cardPairs.map((symbol, index) => {
        const card = createCardElement(symbol, index);
        gameBoard.appendChild(card);
        return {
            element: card,
            symbol: symbol,
            id: index,
            isFlipped: false,
            isMatched: false
        };
    });
}

// 创建单个卡片元素
function createCardElement(symbol, id) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = id;

    const cardFront = document.createElement('div');
    cardFront.className = 'card-face card-front';

    const cardBack = document.createElement('div');
    cardBack.className = 'card-face card-back';
    cardBack.textContent = symbol;

    card.appendChild(cardFront);
    card.appendChild(cardBack);

    card.addEventListener('click', () => handleCardClick(id));

    return card;
}

// 显示卡片预览
function showCardsPreview() {
    gameState.isPreviewing = true;

    // 翻开所有卡片
    gameState.cards.forEach(card => {
        card.element.classList.add('flipped');
    });

    // 显示提示信息
    hintMessage.classList.remove('hidden');
    hintMessage.textContent = '记住卡片位置！';

    let countdown = 3;

    // 3秒后开始倒计时
    setTimeout(() => {
        const countdownInterval = setInterval(() => {
            hintMessage.textContent = `准备开始... ${countdown}`;
            countdown--;

            if (countdown < 0) {
                clearInterval(countdownInterval);

                // 隐藏提示
                hintMessage.classList.add('hidden');

                // 翻回所有卡片
                gameState.cards.forEach(card => {
                    card.element.classList.remove('flipped');
                });

                // 允许开始游戏
                gameState.isPreviewing = false;
            }
        }, 1000);
    }, 3000);
}

// 处理卡片点击
function handleCardClick(id) {
    // 预览期间禁止点击
    if (gameState.isPreviewing) {
        return;
    }

    // 开始计时
    if (!gameState.gameStarted) {
        startTimer();
        gameState.gameStarted = true;
    }

    const card = gameState.cards[id];

    // 检查是否可以翻牌
    if (gameState.isProcessing || card.isFlipped || card.isMatched) {
        return;
    }

    // 翻转卡片
    flipCard(card);
    gameState.flippedCards.push(card);

    // 检查是否翻开了两张卡片
    if (gameState.flippedCards.length === 2) {
        gameState.isProcessing = true;
        gameState.moves++;
        updateDisplay();

        setTimeout(() => {
            checkMatch();
        }, 800);
    }
}

// 翻转卡片
function flipCard(card) {
    card.isFlipped = true;
    card.element.classList.add('flipped');
}

// 翻回卡片
function unflipCard(card) {
    card.isFlipped = false;
    card.element.classList.remove('flipped');
}

// 检查配对
function checkMatch() {
    const [card1, card2] = gameState.flippedCards;

    if (card1.symbol === card2.symbol) {
        // 配对成功
        card1.isMatched = true;
        card2.isMatched = true;
        card1.element.classList.add('matched');
        card2.element.classList.add('matched');

        gameState.matchedPairs++;
        updateDisplay();

        // 检查是否完成游戏
        const config = difficultyConfig[gameState.difficulty];
        if (gameState.matchedPairs === config.pairs) {
            setTimeout(() => {
                endGame();
            }, 500);
        }
    } else {
        // 配对失败
        card1.element.classList.add('wrong');
        card2.element.classList.add('wrong');

        setTimeout(() => {
            card1.element.classList.remove('wrong');
            card2.element.classList.remove('wrong');
            unflipCard(card1);
            unflipCard(card2);
        }, 600);
    }

    gameState.flippedCards = [];
    gameState.isProcessing = false;
}

// 开始计时
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        updateTimerDisplay();
    }, 1000);
}

// 停止计时
function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// 更新计时器显示
function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timer / 60);
    const seconds = gameState.timer % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 更新显示
function updateDisplay() {
    movesDisplay.textContent = gameState.moves;
    const config = difficultyConfig[gameState.difficulty];
    matchesDisplay.textContent = `${gameState.matchedPairs}/${config.pairs}`;
}

// 结束游戏
function endGame() {
    stopTimer();

    // 计算评分
    const score = calculateScore();

    // 显示结果
    document.getElementById('final-time').textContent = timerDisplay.textContent;
    document.getElementById('final-moves').textContent = gameState.moves;
    document.getElementById('final-score').textContent = score;

    victoryModal.classList.remove('hidden');
}

// 计算评分
function calculateScore() {
    const config = difficultyConfig[gameState.difficulty];
    const perfectMoves = config.pairs; // 完美分数需要的移动次数

    let stars = '⭐⭐⭐';

    if (gameState.moves <= perfectMoves + 3) {
        stars = '⭐⭐⭐';
    } else if (gameState.moves <= perfectMoves + 8) {
        stars = '⭐⭐';
    } else {
        stars = '⭐';
    }

    return stars;
}

// 重置游戏
function resetGame() {
    stopTimer();
    gameState = {
        difficulty: gameState.difficulty,
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        timer: 0,
        timerInterval: null,
        isProcessing: false,
        gameStarted: false,
        isPreviewing: false
    };
    gameBoard.innerHTML = '';
    hintMessage.classList.add('hidden');
    updateDisplay();
    updateTimerDisplay();
}

// 洗牌算法（Fisher-Yates）
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 初始化
updateTimerDisplay();
