import "./style.css";

const APP_NAME = "Raul's D2";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
//app.innerHTML = APP_NAME;

const gameName = "Raul's D2";    

const header = document.createElement("h1"); 
header.innerHTML = gameName; 
app.append(header); 

const canvas = document.getElementById('canvas') as HTMLCanvasElement; 
canvas.width = 256; 
canvas.height = 256; 
const ctx = canvas.getContext('2d')!; 

 
if (ctx) {
    ctx.shadowColor = 'grey'; 
    ctx.shadowBlur= 50; 
    ctx.shadowOffsetX = -5; 
    ctx.shadowOffsetY = 5;  

    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, 250, 250); 
}