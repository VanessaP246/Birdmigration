

function preload(){
    csvRohtext = loadTable('data/Bird migration dataset.csv');
    backgroundImage = loadImage('data/mapaMundi1800x600.png');
}

function setup() {
  let canvas = createCanvas(100, 100);
  canvas.parent('map-area');
}