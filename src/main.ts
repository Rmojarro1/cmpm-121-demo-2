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

interface Point{
    x: number; 
    y: number; 
}

let pointArray: Point[][] = []; 
const redoArray: Point[][] = [];
let currentStroke: Point[] = [];

 
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
    currentStroke = []; 
    drawX = event.offsetX; 
    drawY = event.offsetY;
    isDrawing = true; 
}); 

canvas.addEventListener('mousemove', (event) => {
    if(isDrawing) {
        currentStroke.push({x: drawX, y: drawY});
        drawX = event.offsetX;
        drawY = event.offsetY;
        drawingChanged(); 
    }
});

canvas.addEventListener('mouseup', () => {
    if(isDrawing){
        currentStroke.push({x: drawX, y: drawY}); 
        pointArray.push(currentStroke);
        drawX = 0; 
        drawY = 0;
        isDrawing = false; 
        drawingChanged(); 
    }
});

canvas.addEventListener('mouseleave', () => {
    if (isDrawing) {
        currentStroke.push({x: drawX, y: drawY});
        pointArray.push(currentStroke);
        isDrawing = false;
        drawingChanged();
    }
});

clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, 250, 250); 
    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, 250, 250); 
    pointArray = []; 
    drawingChanged(); 
}); 

undoButton.addEventListener('click', () =>{
    if(pointArray.length > 0){
        const lastStroke = pointArray.pop()!; 
        redoArray.push(lastStroke);
        drawingChanged();
    }
})

redoButton.addEventListener('click', () => {
    if(redoArray.length > 0){
        pointArray.push(redoArray.pop()!);
        drawingChanged();
    }
})

function drawingChanged(){
    ctx.clearRect(0, 0, 250, 250); 
    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, 250, 250); 
    pointArray.forEach((stroke) => {
        for(let i = 0; i < stroke.length - 1; i++){
            drawLine(ctx, stroke[i].x, stroke[i].y, stroke[i+1].x, stroke[i+1].y); 
        }
    }); 
}

function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2:number){
    ctx.beginPath(); 
    ctx.strokeStyle = 'black'; 
    ctx.lineWidth = 1; 
    ctx.moveTo(x1, y1); 
    ctx.lineTo(x2, y2); 
    ctx.stroke(); 
    ctx.closePath(); 
}