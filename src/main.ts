import "./style.css";

const APP_NAME = "Raul's D2";

const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

const gameName = "Raul's Drawing Program";

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = 256;
canvas.height = 256;
const ctx = canvas.getContext('2d')!;

const clearButton = document.createElement('button');
clearButton.innerHTML = 'Clear Canvas';
app.append(clearButton);

const undoButton = document.createElement('button');
undoButton.innerHTML = 'Undo';
app.append(undoButton);

const redoButton = document.createElement('button');
redoButton.innerHTML = 'Redo';
app.append(redoButton);

const drawingContainer = document.createElement('div');
app.append(drawingContainer);

const thinButton = document.createElement('button');
thinButton.innerHTML = 'Pencil';
drawingContainer.append(thinButton);

const thickButton = document.createElement('button');
thickButton.innerHTML = 'Marker';
drawingContainer.append(thickButton);

const stickerContainer = document.createElement('div');
app.append(stickerContainer);

function createStickerButton(sticker: string) {
    const button = document.createElement('button');
    button.innerHTML = sticker;
    button.addEventListener('click', () => {
        selectSticker(sticker);
    });
    stickerContainer.append(button);
}

const stickers = ['😈', '👻', '🎃'];
stickers.forEach(createStickerButton);

const customStickerButton = document.createElement('button');
customStickerButton.innerHTML = 'Create Sticker';
app.append(customStickerButton);

customStickerButton.addEventListener('click', () => {
    const enteredText = prompt('Enter emoji to use as sticker') || '';
    if (enteredText.trim()) { 
        createStickerButton(enteredText);
    }
});



let isThin = true;

interface Point {
    x: number;
    y: number;
}

interface Displayable {
    display(context: CanvasRenderingContext2D): void;
}

interface MarkerLine extends Displayable {
    drag(x: number, y: number): void;
    lineWidth: number;
}

interface Sticker extends Displayable {
    updatePosition(x: number, y: number): void;
    sticker: string;
}

function createToolPreview(isThin: boolean): Sticker {
    let x = 0;
    let y = 0;

    return {
        sticker: '',
        updatePosition(newX: number, newY: number) {
            x = newX;
            y = newY;
        },
        display(ctx: CanvasRenderingContext2D) {
            ctx.save();
            ctx.globalAlpha = 0.5;  
            ctx.fillStyle = 'gray';
            ctx.beginPath();
            const radius = isThin ? 3 : 8; 
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    };
}

function createStickerCommand(sticker: string, initialX: number, initialY: number): Sticker {
    let x = initialX;
    let y = initialY;

    return {
        sticker,
        updatePosition(newX: number, newY: number) {
            x = newX;
            y = newY;
            drawingChanged();
        },
        display(ctx: CanvasRenderingContext2D) {
            ctx.save();
            ctx.font = "24px Arial";
            ctx.fillText(sticker, x, y);
            ctx.restore();
        }
    };
}

let currentSticker: Sticker | null = null;
let stickerPlacement: Sticker | null = null;

function selectSticker(sticker: string) {
    currentSticker = createStickerCommand(sticker, 0, 0);
    toolPreview = null;  
    if (!isDrawing) drawingChanged();

    const toolMovedEvent = new Event('tool-moved');
    canvas.dispatchEvent(toolMovedEvent);
}

function createMarkerLine(initialX: number, initialY: number, isThin: boolean): MarkerLine {
    const points: { x: number; y: number }[] = [{ x: initialX, y: initialY }];
    const lineWidth = isThin ? 1 : 4;

    return {
        lineWidth,
        display(context: CanvasRenderingContext2D): void {
            if (points.length < 2) return;
            context.lineWidth = this.lineWidth;
            context.beginPath();
            context.moveTo(points[0].x, points[0].y);

            for (let i = 1; i < points.length; i++) {
                context.lineTo(points[i].x, points[i].y);
            }

            context.stroke();
        },
        drag(x: number, y: number): void {
            points.push({ x, y });
        }
    };
}

const displayList: Displayable[] = [];
const redoList: Displayable[] = [];
let currentLine: MarkerLine | null = null;
let toolPreview: Sticker | null = createToolPreview(isThin);

if (ctx) {
    ctx.shadowColor = 'grey';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetX = -5;
    ctx.shadowOffsetY = 5;

    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, 250, 250);
}

let isDrawing = false;

canvas.addEventListener('mousedown', (event) => {
    if (currentSticker) {
        stickerPlacement = createStickerCommand(currentSticker.sticker, event.offsetX, event.offsetY);
        displayList.push(stickerPlacement);
        drawingChanged();
    } else {
        const drawX = event.offsetX;
        const drawY = event.offsetY;
        currentLine = createMarkerLine(drawX, drawY, isThin);
        isDrawing = true;
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (isDrawing && currentLine) {
        const newX = event.offsetX;
        const newY = event.offsetY;
        currentLine.drag(newX, newY);
        drawingChanged();
    } else if (currentSticker) {
        currentSticker.updatePosition(event.offsetX, event.offsetY);
        drawingChanged();
    } else if (toolPreview) {
        toolPreview.updatePosition(event.offsetX, event.offsetY);
        drawingChanged();
    }
});

canvas.addEventListener('mouseup', () => {
    if (isDrawing && currentLine) {
        displayList.push(currentLine);
        currentLine = null;
        isDrawing = false;
    }
    drawingChanged();
});

canvas.addEventListener('mouseleave', () => {
    if (isDrawing && currentLine) {
        displayList.push(currentLine);
        currentLine = null;
        isDrawing = false;
    }
});

clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, 250, 250);
    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, 250, 250);
    displayList.length = 0;
    drawingChanged();
});

undoButton.addEventListener('click', () => {
    if (displayList.length > 0) {
        const lastElement = displayList.pop()!;
        redoList.push(lastElement);
        drawingChanged();
    }
});

redoButton.addEventListener('click', () => {
    if (redoList.length > 0) {
        displayList.push(redoList.pop()!);
        drawingChanged();
    }
});

thinButton.addEventListener('click', () => {
    isThin = true;
    toolPreview = createToolPreview(true);
    currentSticker = null;  
    if (!isDrawing) drawingChanged();
});

thickButton.addEventListener('click', () => {
    isThin = false;
    toolPreview = createToolPreview(false);
    currentSticker = null; 
    if (!isDrawing) drawingChanged();
});

function drawingChanged() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    displayList.forEach((element) => {
        element.display(ctx);
    });

    if (currentLine) {
        currentLine.display(ctx);
    }

    if (toolPreview && !isDrawing) {
        toolPreview.display(ctx);
    }

    if (currentSticker) {
        currentSticker.display(ctx);
    }
}

const exportRow = document.createElement('div');
app.append(exportRow);
const exportButton = document.createElement('button');
exportButton.innerHTML = 'Export';
exportRow.append(exportButton);

exportButton.addEventListener('click', () => {
    const exportCanvas = document.createElement('canvas');
    const  exportCtx = exportCanvas.getContext('2d')!;
    exportCanvas.width = canvas.width * 4;
    exportCanvas.height = canvas.height * 4; 
    exportCtx.scale(4, 4);
    exportCtx.drawImage(canvas, 0, 0);
    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click()
}); 