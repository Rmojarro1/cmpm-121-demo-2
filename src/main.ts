import "./style.css";

const APP_NAME = "Raul's D2";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const gameName = "Raul's D2";    

const header = document.createElement("h1"); 
header.innerHTML = gameName; 
app.append(header); 

const canvas = document.getElementById('canvas') as HTMLCanvasElement; 
canvas.width = 256; 
canvas.height = 256; 
const ctx = canvas.getContext('2d')!; 

const clearButton = document.createElement('button');
clearButton.innerHTML = 'Clear';
app.append(clearButton);

const undoButton = document.createElement('button');
undoButton.innerHTML = 'Undo';
app.append(undoButton);

const redoButton = document.createElement('button');    
redoButton.innerHTML = 'Redo';
app.append(redoButton);

const thinButton = document.createElement('button');
thinButton.innerHTML = 'Thin';
app.append(thinButton);

const thickButton = document.createElement('button');   
thickButton.innerHTML = 'Thick';
app.append(thickButton);

let isThin = true; 

interface Point{
    x: number; 
    y: number; 
}

interface Displayable{
    display(context: CanvasRenderingContext2D): void;
}

interface MarkerLine extends Displayable{
    drag(x: number, y: number): void; 
    lineWidth: number; 
}

function setCursor(cursorUrl: string): void{
    canvas.style.cursor = `url(${cursorUrl}) 16 16, auto`; 
}

//setCursor('crosshair');


function createMarkerLine(initialX: number, initialY: number, isThin: boolean): MarkerLine {
    const points: { x: number; y: number }[] = [{ x: initialX, y: initialY }];
    const lineWidth = isThin ? 1 : 5;

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

 
if (ctx) {
    ctx.shadowColor = 'grey'; 
    ctx.shadowBlur= 50; 
    ctx.shadowOffsetX = -5; 
    ctx.shadowOffsetY = 5;  

    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, 250, 250); 
}

let isDrawing = false; 
let drawX = 0; 
let drawY = 0;

canvas.addEventListener('mousedown', (event) => {
    drawX = event.offsetX; 
    drawY = event.offsetY;
    currentLine = createMarkerLine(drawX, drawY, isThin);
    isDrawing = true; 
}); 

canvas.addEventListener('mousemove', (event) => {
    if(isDrawing && currentLine){ 
        const newX = event.offsetX;
        const newY = event.offsetY; 
        currentLine.drag(newX, newY);
        drawingChanged();
    }
});

canvas.addEventListener('mouseup', () => {
    if(isDrawing && currentLine){ 
        displayList.push(currentLine);
        currentLine = null;
        drawingChanged(); 
    }
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

undoButton.addEventListener('click', () =>{
    if(displayList.length > 0){
        const lastLine = displayList.pop()!; 
        redoList.push(lastLine);
        drawingChanged();
    }
}); 

redoButton.addEventListener('click', () => {
    if(redoList.length > 0){
        displayList.push(redoList.pop()!);
        drawingChanged();
    }
}); 

function drawingChanged(){
    ctx.clearRect(0, 0, 250, 250); 
    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, 250, 250); 
    displayList.forEach((line) => {
        line.display(ctx)
    });

    if (currentLine) {
        currentLine.display(ctx);
    }
}

thinButton.addEventListener('click', () => {
    isThin = true;
    setCursor('src/smallCircle.png');
}); 

thickButton.addEventListener('click', () => {
    isThin = false;
    setCursor('/src/circle.png');
}); 

