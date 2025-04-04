
  document.addEventListener('DOMContentLoaded', function() {
    // Game state variables
    let board = [];
    let revealed = [];
    let flagged = [];
    let gameOver = false;
    let firstClick = true;
    let timer = null;
    let seconds = 0;
    let score = 0;
    let treasures = 5;
    let maxBlasts = 3;
    let blastsRemaining;
    const WIN_SCORE = 300;
    
    // Game settings
    let width = 9;
    let height = 9;
    let mines = 3;
    
    // DOM elements
    const boardElement = document.getElementById('board');
    const minesCountElement = document.getElementById('mines-count');
    const timeElement = document.getElementById('time');
    const scoreElement = document.getElementById('score');
    const blastsElement = document.getElementById('blasts-remaining');
    const resetButton = document.getElementById('reset-btn');
    const gameContainer = document.getElementById('game-container');
    
    // Difficulty buttons
    document.getElementById('easy-btn').addEventListener('click', () => {
        width = 9;
        height = 9;
        mines = 3;
        treasures = 5;
        maxBlasts = 3;
        startGame();
    });
    
    document.getElementById('medium-btn').addEventListener('click', () => {
        width = 16;
        height = 16;
        mines = 5;
        treasures = 8;
        maxBlasts = 5;
        startGame();
    });
    
    document.getElementById('hard-btn').addEventListener('click', () => {
        width = 30;
        height = 16;
        mines = 8;
        treasures = 12;
        maxBlasts = 8;
        startGame();
    });
    
    document.getElementById('start-btn').addEventListener('click', () => {
        width = parseInt(document.getElementById('width-input').value) || 9;
        height = parseInt(document.getElementById('height-input').value) || 9;
        mines = parseInt(document.getElementById('mines-input').value) || 3;
        treasures = parseInt(document.getElementById('treasures-input').value) || 5;
        maxBlasts = parseInt(document.getElementById('blasts-input').value) || 3;
        
        // Limit values
        const maxCells = width * height;
        mines = Math.min(mines, Math.floor(maxCells * 0.2));
        treasures = Math.min(treasures, Math.floor(maxCells * 0.3));
        maxBlasts = Math.min(maxBlasts, mines);
        
        startGame();
    });
    
    resetButton.addEventListener('click', resetGame);
    
    function startGame() {
        gameContainer.style.display = 'block';
        document.querySelector('.game-controls').style.display = 'none';
        document.querySelector('header').style.display = 'none';
        resetGame();
    }
    
    function resetGame() {
        boardElement.innerHTML = '';
        board = Array(height).fill().map(() => Array(width).fill(0));
        revealed = Array(height).fill().map(() => Array(width).fill(false));
        flagged = Array(height).fill().map(() => Array(width).fill(false));
        gameOver = false;
        firstClick = true;
        blastsRemaining = maxBlasts;
        score = 0;
        
        clearInterval(timer);
        seconds = 0;
        timeElement.textContent = '0';
        
        minesCountElement.textContent = mines;
        scoreElement.textContent = '0';
        blastsElement.textContent = blastsRemaining;
        resetButton.textContent = '😊';
        
        boardElement.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        boardElement.style.gridTemplateRows = `repeat(${height}, 1fr)`;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                cell.addEventListener('click', () => handleCellClick(x, y));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    handleRightClick(x, y);
                });
                
                boardElement.appendChild(cell);
            }
        }
    }
    
    function handleCellClick(x, y) {
        if (gameOver || flagged[y][x]) return;
        
        if (firstClick) {
            firstClick = false;
            placeMines(x, y);
            placeTreasures(x, y);
            startTimer();
        }
        
        if (board[y][x] === -1) {
            // Bomb blast!
            if (blastsRemaining > 0) {
                blastsRemaining--;
                blastsElement.textContent = blastsRemaining;
                
                score = Math.floor(score / 2);
                scoreElement.textContent = score;
                
                // Visual blast effect
                const blastCell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
                blastCell.classList.add('blast');
                blastCell.textContent = '💥';
                
                revealed[y][x] = true;
                
                // Shake animation
                document.getElementById('game-container').classList.add('shake');
                setTimeout(() => {
                    document.getElementById('game-container').classList.remove('shake');
                }, 500);
                
                // Hide half of revealed cells after blast
                setTimeout(() => hideHalfRevealedCells(), 500);
                
                // Check if all blasts used
                if (blastsRemaining === 0) {
                    setTimeout(() => {
                        gameOver = true;
                        resetButton.textContent = '💀';
                        revealAllMines();
                    }, 1000);
                }
                
                return;
            }
        }
        
        if (board[y][x] === -2) {
            // Treasure found
            score += 100;
            scoreElement.textContent = score;
            board[y][x] = 0;
        } else if (board[y][x] > 0) {
            // Number cell
            score += board[y][x];
            scoreElement.textContent = score;
        }
        
        revealCell(x, y);
        
        if (score >= WIN_SCORE) {
            gameOver = true;
            resetButton.textContent = '😎';
            clearInterval(timer);
            setTimeout(() => alert(`Congratulations! You reached ${WIN_SCORE} points!`), 100);
        }
    }
    
    function hideHalfRevealedCells() {
        // Get all revealed cells that aren't mines or treasures
        const revealableCells = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (revealed[y][x] && board[y][x] > 0) { // Only hide number cells
                    revealableCells.push({x, y});
                }
            }
        }
        
        // Shuffle the array
        revealableCells.sort(() => Math.random() - 0.5);
        
        // Hide half of them
        const cellsToHide = Math.floor(revealableCells.length / 2);
        for (let i = 0; i < cellsToHide; i++) {
            const {x, y} = revealableCells[i];
            revealed[y][x] = false;
            updateCell(x, y);
        }
    }
    
    // ... (keep other functions the same as previous version)
    function handleRightClick(x, y) {
        if (gameOver || revealed[y][x]) return;
        
        flagged[y][x] = !flagged[y][x];
        updateCell(x, y);
        
        // Update mines counter
        const flagCount = flagged.flat().filter(Boolean).length;
        minesCountElement.textContent = mines - flagCount;
    }
    
    function placeMines(firstX, firstY) {
        let minesPlaced = 0;
        
        while (minesPlaced < mines) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            
            if ((x === firstX && y === firstY) || board[y][x] === -1) {
                continue;
            }
            
            board[y][x] = -1;
            minesPlaced++;
            
            // Update adjacent cells
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height && board[ny][nx] !== -1 && board[ny][nx] !== -2) {
                        board[ny][nx]++;
                    }
                }
            }
        }
    }
    
    function placeTreasures(firstX, firstY) {
        let treasuresPlaced = 0;
        
        while (treasuresPlaced < treasures) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            
            if ((x === firstX && y === firstY) || board[y][x] === -1 || board[y][x] === -2) {
                continue;
            }
            
            board[y][x] = -2;
            treasuresPlaced++;
        }
    }
    
    function revealCell(x, y) {
        if (x < 0 || x >= width || y < 0 || y >= height || revealed[y][x] || flagged[y][x]) {
            return;
        }
        
        revealed[y][x] = true;
        updateCell(x, y);
        
        if (board[y][x] === 0) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    revealCell(x + dx, y + dy);
                }
            }
        }
    }
    
    function revealAllMines() {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (board[y][x] === -1) {
                    revealed[y][x] = true;
                    updateCell(x, y);
                }
            }
        }
    }
    
    function updateCell(x, y) {
        const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
        cell.className = 'cell';
        
        if (revealed[y][x]) {
            cell.classList.add('revealed');
            
            if (board[y][x] === -1) {
                cell.classList.add('mine');
                cell.textContent = '💣';
            } else if (board[y][x] === -2) {
                cell.classList.add('treasure');
                cell.textContent = '💰';
            } else if (board[y][x] > 0) {
                cell.textContent = board[y][x];
                cell.classList.add(`cell-${board[y][x]}`);
            }
        } else if (flagged[y][x]) {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
        } else if (board[y][x] === -2) {
            cell.classList.add('treasure-hidden');
        }
    }
    
    function startTimer() {
        timer = setInterval(() => {
            seconds++;
            timeElement.textContent = seconds;
        }, 1000);
    }
});
