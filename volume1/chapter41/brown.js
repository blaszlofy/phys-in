import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, curve, line, xyaxes, xycorneraxes, plotv, plotf, xtickmark, bar, ytickmark_empty, text,
    circle
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

//HTML CANVAS
const htmlcanvas = document.getElementById("htmlcanvas");
const ctx = htmlcanvas.getContext("2d");

function resizeCanvas() {
    htmlcanvas.width = htmlcanvas.clientWidth;
    htmlcanvas.height = htmlcanvas.clientHeight;
}
window.addEventListener('resize', resizeCanvas);

const world = {
    left: -8,
    right: 8,
    bottom: -4.5,
    top: 4.5
};

let currentScale = 1

function worldToScreen(x, y) {
    let scaleX = htmlcanvas.width / (world.right - world.left)
    let scaleY = htmlcanvas.height / (world.top - world.bottom)
    currentScale = Math.min(scaleX, scaleY)

    let xOffset = (htmlcanvas.width - (world.right - world.left) * currentScale) / 2
    let yOffset = (htmlcanvas.height - (world.top - world.bottom) * currentScale) / 2

    return {
        x: xOffset + (x - world.left) * currentScale,
        y: yOffset + (world.top - y) * currentScale
    }
}

function drawCircle(position, radius, options = {}) {
    const {
        strokeWidth = 2,
        color = "#1f77b4",
        opacity = 1,
        fill = true
    } = options;

    const p = worldToScreen(position.x, position.y)

    ctx.save()

    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = strokeWidth
    ctx.globalAlpha = opacity

    ctx.beginPath()
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)

    if (fill) {
        ctx.fill()
    } else {
        ctx.stroke()
    }

    ctx.restore()
}

const m = 1
const k = 1
const R = 0.3
const center = V2(0, 0.8)
const width = 14
const height = 6

let bigParticle = {
    p: { x: center.x, y: center.y, z: 0 },
    v: { x: 0, y: 0, z: 0 }
}

let div = line(V2(-8, -3), V2(8, -3))

let coll_l = circle(0.15).strokewidth(0).fill("lightblue").position(V2(-4, -3.45))
let part_l = circle(0.05).strokewidth(0).fill("blue").position(V2(-4, -4.1))
let coll_t = text("Colloidal particle").fontfamily("Math").fontsize(20).position(V2(-2.5, -3.45))
let part_t = text("Gas molecule").fontfamily("Math").fontsize(20).position(V2(-2.7, -4.1))
let path_t = text("Path of the colloidal particle").fontfamily("Math").fontsize(20).position(V2(2.5, -3.775))
let path_l = line(V2(0, 0), V2(0.5, 0)).strokewidth(2).stroke("lightred").position(V2(0, -3.775))

let leg = diagram_combine(coll_l, part_l, coll_t, part_t, path_l, path_t).translate(V2(0.2, 0))

let stat = diagram_combine(div, leg)

let outline = rectangle(16, 9).strokewidth(0);

let int = new Interactive(control, canvas);

let positions = []
let velocities = []
let N_cache = 0
let T_cache = -1

let path = []
let max_path = 2000

let previousTime = performance.now()
function update(time) {
    let M = int.get("M") * 50
    let N = int.get("N")
    let T = int.get("T") / 100

    let v_rms = Math.sqrt(2 * k * T / m)

    const dt = Math.min((time - previousTime) / 1000, 0.05)
    previousTime = time
    let t = time / 1000

    if (N !== N_cache) {
        if (N > N_cache) {
            for (let i = N_cache; i < N; i++) {
                positions.push({
                    x: center.x + (Math.random() - 0.5) * width,
                    y: center.y + (Math.random() - 0.5) * height
                })

                let theta = Math.random() * 2 * Math.PI

                velocities.push({
                    x: Math.cos(theta) * v_rms,
                    y: Math.sin(theta) * v_rms
                })
            }
        } else {
            positions.length = N
            velocities.length = N
        }
        N_cache = N
    } //generate or remove particles based on N
    if (T !== T_cache) {
        if (T_cache !== -1) {
            let old_v_rms = Math.sqrt(2 * k * T_cache / m)
            let speedRatio = v_rms / old_v_rms

            for (let i = 0; i < N; i++) {
                let v = velocities[i]
                v.x *= speedRatio
                v.y *= speedRatio
            }
        }
        T_cache = T
    } //change speeds if T is modified

    let r = 0.04
    let hw = width / 2
    let hh = height / 2

    for (let i = 0; i < N; i++) {
        let p = positions[i]
        let v = velocities[i]

        p.x += v.x * dt
        p.y += v.y * dt

        if (p.x < center.x - hw) {
            p.x = center.x - hw
            v.x = Math.abs(v.x)
        } else if (p.x > center.x + hw) {
            p.x = center.x + hw
            v.x = -Math.abs(v.x)
        }

        if (p.y < center.y - hh) {
            p.y = center.y - hh
            v.y = Math.abs(v.y)
        } else if (p.y > center.y + hh) {
            p.y = center.y + hh
            v.y = -Math.abs(v.y)
        }
    } //collision with the walls

    bigParticle.p.x += bigParticle.v.x * dt
    bigParticle.p.y += bigParticle.v.y * dt

    //big particle wall collisions
    if (bigParticle.p.x < center.x - hw + R) {
        bigParticle.p.x = center.x - hw + R
        bigParticle.v.x = Math.abs(bigParticle.v.x)
    } else if (bigParticle.p.x > center.x + hw - R) {
        bigParticle.p.x = center.x + hw - R
        bigParticle.v.x = -Math.abs(bigParticle.v.x)
    }

    if (bigParticle.p.y < center.y - hh + R) {
        bigParticle.p.y = center.y - hh + R
        bigParticle.v.y = Math.abs(bigParticle.v.y)
    } else if (bigParticle.p.y > center.y + hh - R) {
        bigParticle.p.y = center.y + hh - R
        bigParticle.v.y = -Math.abs(bigParticle.v.y)
    }

    let indices = Array.from({length: N}, (_, i) => i)
    indices.sort((a, b) => positions[a].x - positions[b].x)

    for (let i = 0; i < N; i++) {
        let idx1 = indices[i]
        let p1 = positions[idx1]
        let v1 = velocities[idx1]

        for (let j = i + 1; j < N; j++) {
            let idx2 = indices[j]
            let p2 = positions[idx2]
            let v2 = velocities[idx2]

            if (p2.x - p1.x > 2 * r) break

            let dx = p1.x - p2.x
            let dy = p1.y - p2.y
            let distSq = dx * dx + dy * dy

            if (distSq < 4 * r * r) {
                let dist = Math.sqrt(distSq)
                let nx = dx / dist
                let ny = dy / dist
                let dvx = v1.x - v2.x
                let dvy = v1.y - v2.y
                let dotProduct = dvx * nx + dvy * ny

                if (dotProduct < 0) {
                    v1.x -= dotProduct * nx
                    v1.y -= dotProduct * ny
                    v2.x += dotProduct * nx
                    v2.y += dotProduct * ny
                }

                let overlap = 2 * r - dist
                p1.x += nx * overlap / 2
                p1.y += ny * overlap / 2
                p2.x -= nx * overlap / 2
                p2.y -= ny * overlap / 2
            }
        }
    } //collision between particles

    for (let i = 0; i < N; i++) {
        let p1 = positions[i]
        let v1 = velocities[i]
        let p2 = bigParticle.p
        let v2 = bigParticle.v

        let dx = p1.x - p2.x
        let dy = p1.y - p2.y
        let distSq = dx * dx + dy * dy
        let minDist = r + R

        if (distSq < minDist * minDist) {
            let dist = Math.sqrt(distSq)
            let nx = dx / dist
            let ny = dy / dist
            let dvx = v1.x - v2.x
            let dvy = v1.y - v2.y
            let dotProduct = dvx * nx + dvy * ny

            if (dotProduct < 0) {
                let sumM = m + M
                let scalar1 = (2 * M) / sumM
                let scalar2 = (2 * m) / sumM

                v1.x -= scalar1 * dotProduct * nx
                v1.y -= scalar1 * dotProduct * ny
                v2.x += scalar2 * dotProduct * nx
                v2.y += scalar2 * dotProduct * ny
            }
            let overlap = minDist - dist
            let totalInverseMass = (1 / m) + (1 / M)
            let move1 = (1 / m) / totalInverseMass * overlap
            let move2 = (1 / M) / totalInverseMass * overlap

            p1.x += nx * move1
            p1.y += ny * move1
            p2.x -= nx * move2
            p2.y -= ny * move2

            if (path.length > max_path) {
                path.shift()
            }
            path.push(V2(p2.x, p2.y))
        }
    } //big particle collisions

    ctx.clearRect(0, 0, htmlcanvas.width, htmlcanvas.height)

    for (let i = 0; i < N; i++) {
        drawCircle(V2(positions[i].x, positions[i].y), r * currentScale, { opacity: 0.8, color: "#1f77b4" })
    }

    drawCircle(V2(bigParticle.p.x, bigParticle.p.y), R * currentScale, { opacity: 1, color: "#aec7e8" })

    const delta = 0.3
    let container = rectangle(width + 2 * delta, height + delta).position(center).strokewidth(3).stroke("gray")

    let path_diagram = curve(path).stroke("lightred").strokewidth(2)

    draw(outline, stat, container, path_diagram)
    requestAnimationFrame(update)
}

int.draw_function = (inp) => {

    draw(outline)
}

int.slider("M", 1, 5, 3, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " ⋅ 10⁻²⁴ kg")
int.slider("N", 100, 1000, 700, 1, 10, (name, value) => name + " = " + value.toFixed(0))
int.slider("T", 200, 350, 273, 1, 10, (name, value) => name + " = " + value.toFixed(1) + " K")

resizeCanvas();

int.draw()
int.draw()

requestAnimationFrame(update)