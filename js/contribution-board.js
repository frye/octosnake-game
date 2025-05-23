/**
 * GitHub Contribution Board
 * This file handles the rendering of the GitHub-like contribution board
 */

class ContributionBoard {
    constructor(canvas, cellSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = cellSize;
        this.padding = 1; // Space between cells
        
        // Get computed CSS values
        const rootStyle = getComputedStyle(document.documentElement);
        
        // GitHub contribution colors
        this.colors = {
            0: rootStyle.getPropertyValue('--github-green-0').trim(),
            1: rootStyle.getPropertyValue('--github-green-1').trim(),
            2: rootStyle.getPropertyValue('--github-green-2').trim(), 
            3: rootStyle.getPropertyValue('--github-green-3').trim(),
            4: rootStyle.getPropertyValue('--github-green-4').trim()
        };
        
        this.board = [];
        this.rows = 0;
        this.cols = 0;
    }
    
    // Initialize the board with dimensions based on canvas size
    init() {
        // Use the canvas dimensions provided externally
        console.log(`Canvas dimensions: ${this.canvas.width}x${this.canvas.height}`);
        
        // Calculate rows and columns to completely fill the canvas
        // Adding extra cells to ensure complete coverage even with padding
        this.cols = Math.ceil(this.canvas.width / (this.cellSize + this.padding));
        this.rows = Math.ceil(this.canvas.height / (this.cellSize + this.padding));
        
        // Make sure we have even number of rows/cols
        this.cols = this.cols + (this.cols % 2);
        this.rows = this.rows + (this.rows % 2);
        
        console.log(`Board dimensions: ${this.cols}x${this.rows} cells`);
        
        // Initialize empty board
        this.reset();
    }
    
    // Reset the board to all empty cells with wall patterns
    reset() {
        this.board = [];
        
        // Create a board with all empty cells first
        for (let y = 0; y < this.rows; y++) {
            const row = [];
            for (let x = 0; x < this.cols; x++) {
                row.push(0); // Start with all empty cells
            }
            this.board.push(row);
        }
        
        // Now add wall patterns
        // Get snake start position for safe zone
        const safeZoneX = Math.floor(this.cols / 4); // Quarter of the board width
        const safeZoneY = Math.floor(this.rows / 2); // Half of the board height
        this.generateWalls(safeZoneX, safeZoneY);
    }
    
    // Generate wall patterns
    generateWalls(snakeStartX, snakeStartY) {
        // Safe distance - cells to keep clear in front of the snake
        const safeDistance = 5;
        
        // Generate 4-8 random walls with lengths between 3-7 blocks
        // Using all contribution graph colors for more interesting patterns
        // Minimum distance of 2 blocks between walls
        this.addRandomWalls(3, 7, 4, snakeStartX, snakeStartY, safeDistance);
    }
    
    // Add a horizontal wall with some gaps
    addHorizontalWall(row, gapProbability, fixedIntensity, safeX, safeY, safeDistance) {
        if (row < 0 || row >= this.rows) return;
        
        for (let x = 0; x < this.cols; x++) {
            // Skip if we're in the safe zone
            if (Math.abs(x - safeX) < safeDistance && Math.abs(row - safeY) < safeDistance) {
                continue;
            }
            
            // Create gaps with given probability
            if (Math.random() > gapProbability) {
                // Use varied intensity (1-4) for more interesting walls
                const intensity = fixedIntensity || Math.floor(Math.random() * 4) + 1;
                this.board[row][x] = intensity;
            }
        }
    }
    
    // Add a vertical wall with some gaps
    addVerticalWall(col, gapProbability, fixedIntensity, safeX, safeY, safeDistance) {
        if (col < 0 || col >= this.cols) return;
        
        for (let y = 0; y < this.rows; y++) {
            // Skip if we're in the safe zone
            if (Math.abs(col - safeX) < safeDistance && Math.abs(y - safeY) < safeDistance) {
                continue;
            }
            
            // Create gaps with given probability
            if (Math.random() > gapProbability) {
                // Use varied intensity (1-4) for more interesting walls
                const intensity = fixedIntensity || Math.floor(Math.random() * 4) + 1;
                this.board[y][col] = intensity;
            }
        }
    }
    
    // Add random smaller walls
    addRandomWalls(minLength, maxLength, maxIntensity, safeX, safeY, safeDistance) {
        // Generate 4-8 walls
        const numWalls = Math.floor(Math.random() * 5) + 4; // 4-8 walls
        
        // Keep track of wall positions to ensure minimum distance between walls
        const wallPositions = [];
        
        for (let i = 0; i < numWalls; i++) {
            // Randomly decide between horizontal and vertical wall
            const isHorizontal = Math.random() > 0.5;
            const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
            let startX, startY, valid = false;
            
            // Try to find a valid position (not too close to the snake or other walls)
            let attempts = 0;
            while (!valid && attempts < 15) {
                if (isHorizontal) {
                    startY = Math.floor(Math.random() * this.rows);
                    startX = Math.floor(Math.random() * (this.cols - length));
                } else {
                    startX = Math.floor(Math.random() * this.cols);
                    startY = Math.floor(Math.random() * (this.rows - length));
                }
                
                // Check if this wall would be too close to the snake's start
                let tooCloseToSnake = Math.abs(startX - safeX) < safeDistance && Math.abs(startY - safeY) < safeDistance;
                
                // Check if this wall would be too close to existing walls (minimum 2 blocks distance)
                let tooCloseToWalls = false;
                for (const wall of wallPositions) {
                    const minDistanceToWall = 2; // Minimum distance between walls
                    
                    if (isHorizontal && wall.isHorizontal) {
                        // Two horizontal walls - check vertical distance and overlap
                        if (Math.abs(startY - wall.y) < minDistanceToWall) {
                            // Check if they overlap horizontally
                            const thisEndX = startX + length;
                            const wallEndX = wall.x + wall.length;
                            
                            if (!(thisEndX < wall.x - minDistanceToWall || startX > wallEndX + minDistanceToWall)) {
                                tooCloseToWalls = true;
                                break;
                            }
                        }
                    } else if (!isHorizontal && !wall.isHorizontal) {
                        // Two vertical walls - check horizontal distance and overlap
                        if (Math.abs(startX - wall.x) < minDistanceToWall) {
                            // Check if they overlap vertically
                            const thisEndY = startY + length;
                            const wallEndY = wall.y + wall.length;
                            
                            if (!(thisEndY < wall.y - minDistanceToWall || startY > wallEndY + minDistanceToWall)) {
                                tooCloseToWalls = true;
                                break;
                            }
                        }
                    } else {
                        // One horizontal and one vertical - check intersection area plus buffer
                        const isThisHorizontal = isHorizontal;
                        const isWallHorizontal = wall.isHorizontal;
                        
                        let thisX = startX;
                        let thisY = startY;
                        let thisEndX = isThisHorizontal ? startX + length : startX;
                        let thisEndY = isThisHorizontal ? startY : startY + length;
                        
                        let wallX = wall.x;
                        let wallY = wall.y;
                        let wallEndX = isWallHorizontal ? wall.x + wall.length : wall.x;
                        let wallEndY = isWallHorizontal ? wall.y : wall.y + wall.length;
                        
                        // Check if they come within minimum distance of each other
                        if ((thisX <= wallEndX + minDistanceToWall && thisEndX >= wallX - minDistanceToWall) &&
                            (thisY <= wallEndY + minDistanceToWall && thisEndY >= wallY - minDistanceToWall)) {
                            tooCloseToWalls = true;
                            break;
                        }
                    }
                }
                
                valid = !tooCloseToSnake && !tooCloseToWalls;
                attempts++;
            }
            
            if (valid) {
                // Add to wall positions
                wallPositions.push({
                    x: startX,
                    y: startY,
                    length: length,
                    isHorizontal: isHorizontal
                });
                
                // Create walls with varying intensities (1-4) for interesting patterns
                // We'll use a pattern approach for some walls
                const patternType = Math.floor(Math.random() * 4); // 0-3 different pattern types
                
                if (isHorizontal) {
                    for (let x = startX; x < startX + length; x++) {
                        let intensity;
                        
                        // Different pattern types for more interesting walls
                        switch (patternType) {
                            case 0: // Gradient pattern
                                intensity = 1 + Math.floor((4 * (x - startX)) / length);
                                break;
                            case 1: // Alternating pattern
                                intensity = ((x - startX) % 2) + 1 + Math.floor(Math.random() * 2);
                                break;
                            case 2: // Random pattern with higher intensity
                                intensity = Math.floor(Math.random() * 3) + 2; // 2-4
                                break;
                            default: // Fixed pattern for solid walls
                                intensity = Math.min(maxIntensity, 2 + Math.floor(Math.random() * 3)); // 2-4
                        }
                        
                        this.board[startY][x] = intensity;
                    }
                } else {
                    for (let y = startY; y < startY + length; y++) {
                        let intensity;
                        
                        // Different pattern types for more interesting walls
                        switch (patternType) {
                            case 0: // Gradient pattern
                                intensity = 1 + Math.floor((4 * (y - startY)) / length);
                                break;
                            case 1: // Alternating pattern
                                intensity = ((y - startY) % 2) + 1 + Math.floor(Math.random() * 2);
                                break;
                            case 2: // Random pattern with higher intensity
                                intensity = Math.floor(Math.random() * 3) + 2; // 2-4
                                break;
                            default: // Fixed pattern for solid walls
                                intensity = Math.min(maxIntensity, 2 + Math.floor(Math.random() * 3)); // 2-4
                        }
                        
                        this.board[y][startX] = intensity;
                    }
                }
            }
        }
    }
    
    // Draw the entire contribution board
    draw() {
        // First draw the background to cover the whole canvas
        this.drawBackground();
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cellValue = this.board[y][x];
                this.drawCell(x, y, this.colors[cellValue]);
            }
        }
    }
    
    // Draw background to fill the entire canvas
    drawBackground() {
        // Fill the entire canvas with the base color (empty cell color)
        this.ctx.fillStyle = this.colors[0];
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Draw a single cell on the board
    drawCell(x, y, color) {
        const xPos = x * (this.cellSize + this.padding);
        const yPos = y * (this.cellSize + this.padding);
        
        // Fill the cell with the appropriate color
        this.ctx.fillStyle = color;
        this.ctx.fillRect(xPos, yPos, this.cellSize, this.cellSize);
        
        // Add a subtle grid line for better visibility
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.strokeRect(xPos, yPos, this.cellSize, this.cellSize);
    }
    
    // Get position in pixels
    getPixelPosition(boardX, boardY) {
        return {
            x: boardX * (this.cellSize + this.padding),
            y: boardY * (this.cellSize + this.padding)
        };
    }
    
    // Check if position is within bounds
    isValidPosition(x, y) {
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
    }
    
    // Check if a position is a wall
    isWall(x, y) {
        if (!this.isValidPosition(x, y)) return false;
        return this.board[y][x] >= 2; // Intensities 2, 3, and 4 are considered walls
    }
    
    // Increase cell intensity when snake passes through
    increaseIntensity(x, y) {
        if (this.isValidPosition(x, y)) {
            // Increase intensity up to maximum (4)
            this.board[y][x] = Math.min(4, this.board[y][x] + 1);
        }
    }
    
    // Decrease cell intensity when snake tail moves away
    decreaseIntensity(x, y) {
        if (this.isValidPosition(x, y)) {
            // Return to original intensity (0) for non-wall cells
            // Wall cells (intensity >= 2) should remain as walls
            if (this.board[y][x] < 2) {
                this.board[y][x] = 0;
            }
        }
    }
}
