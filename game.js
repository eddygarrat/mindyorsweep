document.addEventListener('DOMContentLoaded', function() {
    // Game state variables
    let board = [];
    let revealed = [];
    let flagged = [];
    let gameOver = false;
    let firstClick = true;
    let timer = null;
    let seconds = 0;
    
    // Game settings
    let width = 9;
    let height = 9;
    let mines = 10;
    
    // DOM elements
    const boardElement = document.getElementById('board');
    const minesCountElement = document.getElementById('mines-count');
    const timeElement = document.getElementById('time');
    const resetButton = document.getElementById('reset-btn');
    const gameContainer = document.getElementById('game-container');
    
    // Difficulty buttons
    document.getElementById('easy-btn').addEventListener('click', () => {
        width = 9;
        height = 9;
        mines = 10;
        startGame();
    });
    
    document.getElementById('medium-btn').addEventListener('click', () => {
        width = 16;
        height = 16;
        mines = 40;
        startGame();
    });
    
    document.getElementById('hard-btn').addEventListener('click', () => {
        width = 30;
        height = 16;
        mines = 99;
        startGame();
    });
    
    document.getElementById('start-btn').addEventListener('click', () => {
        width = parseInt(document.getElementById('width-input').value) || 9;
        height = parseInt(document.getElementById('height-input').value) || 9;
        const maxMines = Math.floor(width * height * 0.35);
        mines = parseInt(document.getElementById('mines-input').value) || 10;
        mines = Math.min(mines, maxMines);
        startGame();
    });
    
    resetButton.addEventListener('click', resetGame);
    
    function startGame() {
        // Hide welcome screen and show game
        gameContainer.style.display = 'block';
        document.querySelector('.game-controls').style.display = 'none';
        document.querySelector('header').style.display = 'none';
        
        // Initialize game
        resetGame();
    }
    
    function resetGame() {
        // Clear existing board
        boardElement.innerHTML = '';
        
        // Reset game state
        board = Array(height).fill().map(() => Array(width).fill(0));
        revealed = Array(height).fill().map(() => Array(width).fill(false));
        flagged = Array(height).fill().map(() => Array(width).fill(false));
        gameOver = false;
        firstClick = true;
        
        // Reset timer
        clearInterval(timer);
        seconds = 0;
        timeElement.textContent = '0';
        
        // Update mines counter
        minesCountElement.textContent = mines;
        resetButton.textContent = '😊';
        
        // Create board UI
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
            startTimer();
        }
        
        if (board[y][x] === -1) {
            // Clicked on a mine
            gameOver = true;
            revealAllMines();
            resetButton.textContent = '😵';
            clearInterval(timer);
            return;
        }
        
        revealCell(x, y);
        
        if (checkWin()) {
            gameOver = true;
            resetButton.textContent = '😎';
            clearInterval(timer);
            // Flag all mines
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (board[y][x] === -1) {
                        flagged[y][x] = true;
                        updateCell(x, y);
                    }
                }
            }
        }
    }
    
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
            
            // Don't place mine on first click position or where a mine already exists
            if ((x === firstX && y === firstY) || board[y][x] === -1) {
                continue;
            }
            
            board[y][x] = -1; // -1 represents a mine
            minesPlaced++;
            
            // Update adjacent cells
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height && board[ny][nx] !== -1) {
                        board[ny][nx]++;
                    }
                }
            }
        }
    }
    
    function revealCell(x, y) {
        if (x < 0 || x >= width || y < 0 || y >= height || revealed[y][x] || flagged[y][x]) {
            return;
        }
        
        revealed[y][x] = true;
        updateCell(x, y);
        
        // If it's an empty cell, reveal adjacent cells
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
            } else if (board[y][x] > 0) {
                cell.textContent = board[y][x];
                cell.classList.add(`cell-${board[y][x]}`);
            }
        } else if (flagged[y][x]) {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
        }
    }
    
    function checkWin() {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (board[y][x] !== -1 && !revealed[y][x]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    function startTimer() {
        timer = setInterval(() => {
            seconds++;
            timeElement.textContent = seconds;
        }, 1000);
    }
});
