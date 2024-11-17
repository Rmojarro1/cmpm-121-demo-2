import "./style.css";

const APP_NAME = "Raul's D2";

const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

const gameName = "Raul's Drawing Program";

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);


const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 256;
const EXPORT_SCALE = 4;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext("2d")!;

const canvasContainer = document.createElement("div");
canvasContainer.id = "canvasContainer";
canvasContainer.append(document.getElementById("canvas")!);
app.append(canvasContainer);

createButton("Clear Canvas", () => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "lightgrey";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    displayList.length = 0;
    drawingChanged();
});

createButton("Undo", () => {
    if (displayList.length > 0) {
        const lastElement = displayList.pop()!;
        redoList.push(lastElement);
        drawingChanged();
    }
});

createButton("Redo", () => {
    if (redoList.length > 0) {
        displayList.push(redoList.pop()!);
        drawingChanged();
    }
});

const drawingContainer = document.createElement("div");
app.append(drawingContainer);

createButton("Pencil", () => {
    isThin = true;
    toolPreview = createToolPreview(true);
    currentSticker = null;
    if (!isDrawing) drawingChanged();
}, drawingContainer);

createButton("Marker", () => {
    isThin = false;
    toolPreview = createToolPreview(false);
    currentSticker = null;
    if (!isDrawing) drawingChanged();
}, drawingContainer);

const colorSlider = document.createElement("input");
colorSlider.type = "range";
colorSlider.min = "0";
colorSlider.max = "360";
colorSlider.value = "0";
colorSlider.id = "colorPicker";
app.append(colorSlider);
const colorLable = document.createElement("label");
colorLable.innerHTML = "Marker Color";
colorLable.htmlFor = "colorPicker";

const colorPreview = document.createElement("div");
colorPreview.style.width = "50px";
colorPreview.style.height = "50px";
colorPreview.style.border = "1px solid black";
colorPreview.style.display = "inline-block";
colorPreview.style.marginLeft = "10px";
app.append(colorLable, colorSlider, colorPreview);

let currentMarkerColor = `hsl(${colorSlider.value}, 100%, 50%)`;
colorPreview.style.backgroundColor = currentMarkerColor;
colorSlider.addEventListener("input", () => {
    const hue = parseInt(colorSlider.value);
    currentMarkerColor = `hsl(${hue}, 100%, 50%)`;
    colorPreview.style.backgroundColor = currentMarkerColor;
});



function createButton(
    label: string, 
    onClick: () => void, 
    parent: HTMLElement = app
): HTMLButtonElement {
    const button = document.createElement("button");
    button.innerHTML = label;
    button.addEventListener("click", onClick);
    parent.append(button);
    return button;
}

// Returns the true origin of a sticker given its location and size
function calculateStickerOrigin(x: number, y: number, size: number) {
    const offsetX = size / -1.5;
    const offsetY = size / 3;
    return { x: x + offsetX, y: y + offsetY };
}

const stickerContainer = document.createElement("div");
app.append(stickerContainer);

function createStickerButton(sticker: string) {
    const button = document.createElement("button");
    button.innerHTML = sticker;
    button.addEventListener("click", () => {
        selectSticker(sticker);
    });
    stickerContainer.append(button);
}

const stickers = ["😈", "👻", "🎃"];
stickers.forEach(createStickerButton);

const customStickerButton = document.createElement("button");
customStickerButton.innerHTML = "Create Sticker";
app.append(customStickerButton);

customStickerButton.addEventListener("click", () => {
    const enteredText = prompt("Enter emoji to use as sticker") || "";
    if (enteredText.trim()) {
        createStickerButton(enteredText);
    }
});

let isThin = true;
/*const thinMarkerColor = 'black';
const thickMarkerColor = 'red';*/

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
    color: string;
}

interface Sticker extends Displayable {
    updatePosition(x: number, y: number): void;
    sticker: string;
}

function createToolPreview(isThin: boolean): Sticker {
    let x = 0;
    let y = 0;

    return {
        sticker: "",
        updatePosition(newX: number, newY: number) {
            x = newX;
            y = newY;
        },
        display(ctx: CanvasRenderingContext2D) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "gray";
            ctx.beginPath();
            const radius = isThin ? 3 : 8;
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        },
    };
}

function createStickerCommand(
    sticker: string,
    initialX: number,
    initialY: number,
): Sticker {
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
            const origin = calculateStickerOrigin(x, y, 24);
            ctx.fillText(sticker, origin.x, origin.y);
            ctx.restore();
        },
    };
}

let currentSticker: Sticker | null = null;
let stickerPlacement: Sticker | null = null;

function selectSticker(sticker: string) {
    currentSticker = createStickerCommand(sticker, 0, 0);
    toolPreview = null;
    if (!isDrawing) drawingChanged();

    const toolMovedEvent = new Event("tool-moved");
    canvas.dispatchEvent(toolMovedEvent);
}

function createMarkerLine(
    initialX: number,
    initialY: number,
    isThin: boolean,
    color: string,
): MarkerLine {
    const points: { x: number; y: number }[] = [{ x: initialX, y: initialY }];
    const lineWidth = isThin ? 1 : 4;

    return {
        lineWidth,
        color,
        display(context: CanvasRenderingContext2D): void {
            if (points.length < 2) return;
            context.lineWidth = this.lineWidth;
            context.strokeStyle = this.color;
            context.beginPath();
            context.moveTo(points[0].x, points[0].y);

            for (let i = 1; i < points.length; i++) {
                context.lineTo(points[i].x, points[i].y);
            }

            context.stroke();
        },
        drag(x: number, y: number): void {
            points.push({ x, y });
        },
    };
}

const displayList: Displayable[] = [];
const redoList: Displayable[] = [];
let currentLine: MarkerLine | null = null;
let toolPreview: Sticker | null = createToolPreview(isThin);

if (ctx) {
    ctx.shadowColor = "grey";
    ctx.shadowBlur = 50;
    ctx.shadowOffsetX = -5;
    ctx.shadowOffsetY = 5;

    ctx.fillStyle = "lightgrey";
    ctx.fillRect(0, 0, 250, 250);
}

let isDrawing = false;

canvas.addEventListener("mousedown", (event) => {
    if (currentSticker) {
        stickerPlacement = createStickerCommand(
            currentSticker.sticker,
            event.offsetX,
            event.offsetY,
        );
        displayList.push(stickerPlacement);
        drawingChanged();
    } else {
        const drawX = event.offsetX;
        const drawY = event.offsetY;
        currentLine = createMarkerLine(
            drawX,
            drawY,
            isThin,
            currentMarkerColor,
        );
        isDrawing = true;
    }
});

canvas.addEventListener("mousemove", (event) => {
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

canvas.addEventListener("mouseup", () => {
    if (isDrawing && currentLine) {
        displayList.push(currentLine);
        currentLine = null;
        isDrawing = false;
    }
    drawingChanged();
});

canvas.addEventListener("mouseleave", () => {
    if (isDrawing && currentLine) {
        displayList.push(currentLine);
        currentLine = null;
        isDrawing = false;
    }
});


function drawingChanged() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "lightgrey";
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

const exportRow = document.createElement("div");
app.append(exportRow);

createButton("Export", () => {
    const exportCanvas = document.createElement("canvas");
    const exportCtx = exportCanvas.getContext("2d")!;
    exportCanvas.width = canvas.width * EXPORT_SCALE;
    exportCanvas.height = canvas.height * EXPORT_SCALE;
    exportCtx.scale(EXPORT_SCALE, EXPORT_SCALE);
    exportCtx.drawImage(canvas, 0, 0);
    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
}, exportRow);
