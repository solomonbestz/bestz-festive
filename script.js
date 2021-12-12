// Variable Declarations for the counter
const christ_mas = "25 dec 2021"
let dom_days = document.querySelector("#days")
let dom_hours = document.querySelector("#hours")
let dom_minutes = document.querySelector("#minutes")
let dom_seconds = document.querySelector("#seconds")

// Not supported in all browsers though and sometimes needs a prefix, so we need a shim
window.requestAnimFrame = ( function() {
    return window.requestAnimationFrame || 
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function( callback ) {
                window.setTimeout( callback, 1000 / 60 )
            }
})()

//Variables for the firework
let canvas = document.querySelector('#canvas'),
ctx = canvas.getContext('2d'),
// full screen dimension
cw = window.innerWidth,
ch = window.innerHeight,
// firework collection
fireworks = [],
// particles collection
particles = [],
// starting hue
hue = 120,
limiterTotal = 5,
limiterTick = 0,
timerTotal = 80,
timerTick = 0,
mousedown = true,
mx, my;
// Set canvas dimensions
canvas.width = cw
canvas.height = ch

// Setup our function placeholder for the entire work

// get a random number within a range
function random(min, max){
    return Math.random() * (max - min) + min
}

// Calculate the distance between two points
function calculateDistance(p1x, p1y, p2x, p2y){
    let xDistance = p1x - p2x,
        yDistance = p1y - p2y
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2))
}

// Create firework
function Firework(sx, sy, tx, ty){
    // Real coordinates
    this.x = sx
    this.y = sy
    //  Starting coordinates
    this.sx = sx
    this.sy = sy
    //  target coordinates
    this.tx = tx
    this.ty = ty
    // distance from starting point to target
    this.distanceToTarget = calculateDistance(sx, sy, tx, ty)
    this.distanceTraveled = 0

    // Track the past coordinates of each firework to create a trail effect, increase the coordinate count to create more prominent trails
    this.coordinates = []
    this.coordinateCount = 3
    // populate initial coorinate collection with the current coordinates
    while(this.coordinateCount--){
        this.coordinates.push([this.x, this.y])
    }
    this.angle = Math.atan2(ty - sy, tx - sx)
    this.speed = 0.5
    this.acceleration = 1.02
    this.brightness = random(50, 70)

    // circle target indicator radius
    this.targetRadius = 1
}

// Update Firework
Firework.prototype.update = function(index){
    // remove last item in coordinates array
    this.coordinates.pop()
    // add current coordinates to the start of the array
    this.coordinates.unshift([this.x, this.y])
    // cycle the circle target indicator radius
    if(this.targetRadius < 8){
        this.targetRadius += 0.3
    } else {
        this.targetRadius = 1
    }

    // spped up the firework
    this.speed *= this.acceleration

    // get the current velocities based on angle and speed
    let vx = Math.cos(this.angle) * this.speed,
        vy = Math.sin(this.angle) * this.speed
    
    // how far will the firework have traveled with velocities applied?
    this.distanceTraveled = calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy)

    // if the distance traveled, including velocities, is greater than the initial distance to the target, then the target has been reached
    if(this.distanceTraveled >= this.distanceToTarget){
        createParticles(this.tx, this.ty)
        // remove the firework, use the index passed into the update function to determine which to remove
        fireworks.splice(index, 1)
    } else {
        // target not reached, keep traveling
        this.x += vx
        this.y += vy
    }
}

// draw firework
Firework.prototype.draw = function() {
    ctx.beginPath()
    // Move to the last tracked coordinate in the set, then draw a line to the urrent x and y
    ctx.moveTo(this.coordinates[
        this.coordinates.length - 1][0],
        this.coordinates[this.coordinates.length - 1][1])
    ctx.lineTo(this.x, this.y)
    ctx.strokeStyle = 'hsl(' + hue + ', 100%, ' + this.brightness + '%)'
    ctx.stroke()

    ctx.beginPath()
    // draw the target for this firework with a pulsing circle
    // ctx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2)
    ctx.stroke()
}

// Create particle
function Particle(x, y){
    this.x = x
    this.y = y
    // track the past coordinates of eah particles to create a trail effect, increase
    // the coordinate count to create more prominent trails
    this.coordinates = []
    this.coordinateCount = 5
    while(this.coordinateCount--){
        this.coordinates.push([this.x, this.y])
    }
    // set a random angle in all possible directions, in radians
    this.angle = random(0, Math.PI * 2)
    this.speed = random(1, 10)
    // friction will slow the particle down
    this.friction = 0.95
    // gravity will be applied and pull the particle down
    this.gravity = 1
    // set the hue to a random number +=50 of the overall hue variable
    this.hue = random(hue - 50, hue + 50)
    this.brightness = random(50, 80)
    this.alpha = 1

    // set how fast the particles fades out
    this.decay = random(0.015, 0.03)
}

// update particle
Particle.prototype.update = function(index){
    // remove last item in coordinates array
    this.coordinates.pop()
    // add current coordinates to the start of the array
    this.coordinates.unshift([this.x, this.y])
    // slow down the particle
    this.speed *= this.friction
    // apply velocity
    this.x += Math.cos(this.angle) * this.speed
    this.y += Math.sin(this.angle) * this.speed + this.gravity
    //  fade out the particle
    this.alpha -= this.decay

    // remove the particle once the alpha is low enough, based on the passed in index
    if(this.alpha <= this.decay){
        particles.splice(index, 1)
    }
}

// Draw particle
Particle.prototype.draw = function(){
    ctx.beginPath()

    // move to the tracked coordinates in the set, then draw a line to the current x and y
    ctx.moveTo(this.coordinates[
        this.coordinates.length -1][0],
        this.coordinates[this.coordinates.length - 1][1])
    ctx.lineTo(this.x, this.y)
    ctx.strokeStyle = 'hsla(' + this.hue + ', 100%, '+this.brightness + '%, '+ this.alpha + ')'
    ctx.stroke()
}

// Create particle group/explosion
function createParticles(x, y){
    // increase the particle count for abigger explosion, beware of the canvas performance hit with the increased particles though
    let ParticleCount = 100
    while(ParticleCount--){
        particles.push(new Particle(x, y))
    }
}

// Main firework loop
function loop(){
    // this function will run endlessly with requestAnimationFrame
    requestAnimationFrame(loop)

    // increase the hue to get different coored fireworks over time
    // hue += 0.5

    // create random color
    hue = random(0, 360)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, cw, ch)
    ctx.globalCompositeOperation = 'lighter'

    let i = fireworks.length
    while(i--){
        fireworks[i].draw()
        fireworks[i].update(i)
    }

    let n = particles.length
    while(n--){
        particles[n].draw()
        particles[n].update(n)
    }

    if(timerTick >= timerTotal){
        if(!mousedown){
            fireworks.push(new Firework(cw / 2, ch, random(0, cw), random(0, ch/2)))
            timerTick = 0
        }
    }else{
        timerTick++
    }

    if(limiterTick >= limiterTotal){
        if(mousedown){
            fireworks.push(new Firework(cw / 2, ch, random(0, cw), random(0, ch/2)))
            limiterTick = 0
        }
    }else{
        limiterTick++
    }
}

// FUNCTION FOR THE COUNTDOWN
function countdown(){
    const christ_mas_date = new Date(christ_mas)
    const current_date = new Date()

    const total_seconds =  (christ_mas_date - current_date) / 1000

    const days = Math.floor(total_seconds / 3600 / 24) 
    const hours = Math.floor(total_seconds / 3600) % 24
    const minutes = Math.floor(total_seconds / 60) % 60
    const seconds = Math.floor(total_seconds % 60)

    dom_days.innerHTML = days
    dom_hours.innerHTML = hours
    dom_minutes.innerHTML = minutes
    dom_seconds.innerHTML = seconds

    if(seconds === 0 && minutes === 0){
        console.log("Working")
        window.location.reload(true)
    }
}

// FUNCTION TO KICK OFF
function kick(){
    const christ_mas_date = new Date(christ_mas)
    const current_date = new Date()

    const total_seconds =  (christ_mas_date - current_date) / 1000

    const days = Math.floor(total_seconds / 3600 / 24) 
    const hours = Math.floor(total_seconds / 3600) % 24
    const minutes = Math.floor(total_seconds / 60) % 60


    if(days === 0 && hours === 0 && minutes <= 52  ){
        canvas.style.display = "block"
        loop()
    }else{
        canvas.style.display = "none"
    }
}

kick()
countdown();

setInterval(countdown, 1000)

