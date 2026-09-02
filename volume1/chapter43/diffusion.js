import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, curve, line, xyaxes, xycorneraxes, plotv, plotf, xtickmark, bar, ytickmark_empty, text,
    circle, mod
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");
let button = document.getElementById("restart")

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
const center = V2(0, 1.8)
const width = 14
const height = 5
const amount = 40

let bound = line(V2(0, center.y - height / 2 - 0.4), V2(-width / 2 + 1, center.y - height / 2 - 0.4)).apply(mod.subdivide(300))

let div = line(V2(-8, -3), V2(8, -3))

let part_l = circle(0.05).strokewidth(0).fill("blue").position(V2(-4, -3.775))
let part_l2 = circle(0.05).strokewidth(0).fill("red").position(V2(-4.2, -3.775))
let part_t = text("Gas molecule").fontfamily("Math").fontsize(20).position(V2(-2.9, -3.775))
let path_t = text("Distribution of the red particles").fontfamily("Math").fontsize(20).position(V2(2.5, -3.775))
let path_l = line(V2(0, 0), V2(0.4, 0)).strokewidth(30).stroke("lightred").position(V2(0, -3.775)).opacity(0.6)

let leg = diagram_combine(part_l, part_l2, part_t, path_l, path_t).translate(V2(0.6, 0))

let n_t = text("n").fontsize(20).fontfamily("Math").position(V2(-width / 2 - 0.3, -1.2))
let x_t = text("x (m)").fontsize(20).fontfamily("Math").position(V2(width / 2 + 0.7, -2.8))

let stat = diagram_combine(div, leg, n_t, x_t)

let outline = rectangle(16, 9).strokewidth(0);

let int = new Interactive(control, canvas);

let positions = []
let velocities = []
let N_cache = 0
let T_cache = -1

let previousTime = performance.now()
function update(time) {
    let N = int.get("N")
    let T = int.get("T") / 100
    let p = int.get("p")

    let v_rms = Math.sqrt(2 * k * T / m)

    const dt = Math.min((time - previousTime) / 1000, 0.05)
    previousTime = time
    let t = time / 1000

    if (N !== N_cache) {
        if (N > N_cache) {
            for (let i = N_cache; i < N; i++) {
                let part = {
                    x: center.x + (Math.random() - 0.5) * width,
                    y: center.y + (Math.random() - 0.5) * height
                }
                part.red = part.x < p.x
                positions.push(part)

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

    let redDensity = new Array(amount).fill(0)

    let leftEdge = center.x - width / 2
    let stripWidth = width / amount

    for (let i = 0; i < N; i++) {
        let p = positions[i]
        if (p.red) {
            let index = Math.floor((p.x - leftEdge) / stripWidth)

            index = Math.max(0, Math.min(index, amount - 1))

            redDensity[index]++;
        }
    }

    ctx.clearRect(0, 0, htmlcanvas.width, htmlcanvas.height)

    for (let i = 0; i < N; i++) {
        drawCircle(V2(positions[i].x, positions[i].y), r * currentScale, { opacity: 0.8, color: positions[i].red ? "#d62728" : "#1f77b4"})
    }

    const delta = 0.3
    let container = rectangle(width + 2 * delta, height + delta).position(center).strokewidth(3).stroke("gray")

    let bar_opt = {
        gap: 0,
        yrange: [0, N / amount * 2],
        bbox: [V2(-width / 2 - delta, -2.8), V2(width / 2 + delta, -1.4)]
    }
    let ax_opt = {
        xrange: [-1, redDensity.length],
        yrange: bar_opt.yrange,
        yticks: [],
        xticks: [],
        bbox: bar_opt.bbox,
        headsize: 0.1
    }

    let dist = bar.plot(redDensity, bar_opt).stroke("red").fill("lightred").opacity(0.4)
    let dist_ax = xycorneraxes(ax_opt).stroke("black").fill("black")

    let divider = line(p.add(V2(0, 0.3)), p.add(V2(0, 0.3 + height + delta))).stroke("gray").strokewidth(2).strokedasharray([10])

    draw(outline, stat, container, dist, dist_ax, divider)
    requestAnimationFrame(update)
}

int.draw_function = (inp) => {

    draw(outline)
}

int.slider("N", 300, 1000, 700, 1, 10, (name, value) => name + " = " + value.toFixed(0))
int.slider("T", 200, 350, 273, 1, 10, (name, value) => name + " = " + value.toFixed(1) + " K")

int.locator("p", V2(0, 0), 0.2, "blue", bound)

resizeCanvas();

int.draw()
int.draw()

button.onclick = () => {
    positions = []
    velocities = []
    N_cache = 0
}

requestAnimationFrame(update)