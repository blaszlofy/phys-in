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
const q = 5
const k = 1
const center = V2(0, 0.75)
const width = 13
const height = 5

let coll_l = circle(0.05).strokewidth(0).fill("blue").position(V2(-4, -3.45))
let part_l = circle(0.05).strokewidth(0).fill("red").position(V2(-4, -4.1))
let coll_t = text("Gas molecule").fontfamily("Math").fontsize(20).position(V2(-2.95, -3.45))
let part_t = text("Ionized gas molecule").fontfamily("Math").fontsize(20).position(V2(-2.48, -4.1))
let path_t = text("Point moving at drift velocity").fontfamily("Math").fontsize(20).position(V2(2.5, -3.775))
let path_l =  circle(0.1).strokewidth(0).fill("lightred").position(V2(0.5, -3.775))

let leg = diagram_combine(coll_l, part_l, coll_t, part_t, path_l, path_t).translate(V2(0.2, 0))

let div = line(V2(-8, -3), V2(8, -3))

const delta = 0.3
let container = rectangle(width + 2 * delta, height + delta).position(center).strokewidth(3).stroke("gray")
let battery = diagram_combine(
    line(container.get_anchor("bottom-left"), container.get_anchor("top-left")).strokewidth(5),
    line(container.get_anchor("bottom-right"), container.get_anchor("top-right")).strokewidth(5),
    curve([
        container.get_anchor("center-left"),
        container.get_anchor("center-left").add(V2(-0.6, 0)),
        container.get_anchor("center-left").add(V2(-0.6, -height / 2 - delta - 0.4)),
        container.get_anchor("bottom-center").add(V2(0, -0.55)),
        container.get_anchor("center-right").add(V2(0.6, -height / 2 - delta - 0.4)),
        container.get_anchor("center-right").add(V2(0.6, 0)),
        container.get_anchor("center-right"),
    ]),
    rectangle(1.8, 0.6).position(container.get_anchor("bottom-center").add(V2(0, -0.55))).strokewidth(0).fill("lightgray"),
)

let stat = diagram_combine(div, container, battery, leg)

let outline = rectangle(16, 9).strokewidth(0);

let int = new Interactive(control, canvas);

let positions = []
let velocities = []
let N_cache = 0
let n_cache = 0

let drift_x = 0

let previousTime = performance.now()
function update(time) {
    let V = int.get("V")
    let n = int.get("n")
    let N = int.get("N")
    let T = 273 / 100

    let v_rms = Math.sqrt(2 * k * T / m)

    const dt = Math.min((time - previousTime) / 1000, 0.05)
    previousTime = time
    let t = time / 1000

    if (N !== N_cache) {
        if (N > N_cache) {
            for (let i = N_cache; i < N; i++) {
                positions.push({
                    x: center.x + (Math.random() - 0.5) * width,
                    y: center.y + (Math.random() - 0.5) * height,
                    isIon: false
                })

                let theta = Math.random() * 2 * Math.PI

                velocities.push({
                    x: Math.cos(theta) * v_rms,
                    y: Math.sin(theta) * v_rms
                })
            }
        } else {
            let sum_N = N_cache - N;
            for (let i = positions.length - 1; i >= 0; i--) {
                if (sum_N <= 0) break;
                if (!positions[i].isIon) {
                    positions.splice(i, 1);
                    velocities.splice(i, 1);
                    sum_N--;
                }
            }
        }
        N_cache = N
    } //generate or remove particles based on N
    if (n !== n_cache) {
        if (n > n_cache) {
            for (let i = n_cache; i < n; i++) {
                positions.push({
                    x: center.x + (Math.random() - 0.5) * width,
                    y: center.y + (Math.random() - 0.5) * height,
                    isIon: true
                })

                let theta = Math.random() * 2 * Math.PI

                velocities.push({
                    x: Math.cos(theta) * v_rms,
                    y: Math.sin(theta) * v_rms
                })
            }
        } else {
            let sum_n = n_cache - n;
            for (let i = positions.length - 1; i >= 0; i--) {
                if (sum_n <= 0) break;
                if (positions[i].isIon) {
                    positions.splice(i, 1);
                    velocities.splice(i, 1);
                    sum_n--;
                }
            }
        }
        n_cache = n
    } //generate or remove ionized particles based on n

    let r = 0.04
    let hw = width / 2
    let hh = height / 2

    let v_drift = (q * V / (m * width)) * (1 / (Math.SQRT2 * ((N + n) / (width * height)) * (2 * r))) / v_rms

    for (let i = 0; i < N + n; i++) {
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

    let indices = Array.from({length: N + n}, (_, i) => i)
    indices.sort((a, b) => positions[a].x - positions[b].x)

    for (let i = 0; i < N + n; i++) {
        if (positions[i].isIon) {
            velocities[i].x += (q * V / (m * width)) * dt
        }
    }

    for (let i = 0; i < N + n; i++) {
        let idx1 = indices[i]
        let p1 = positions[idx1]
        let v1 = velocities[idx1]

        for (let j = i + 1; j < N + n; j++) {
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

    let currentSqSpeedSum = 0
    let neutralCount = 0
    for (let i = 0; i < positions.length; i++) {
        if (!positions[i].isIon) {
            currentSqSpeedSum += velocities[i].x * velocities[i].x + velocities[i].y * velocities[i].y
            neutralCount++
        }
    }

    if (neutralCount > 0) {
        let current_v_rms = Math.sqrt(currentSqSpeedSum / neutralCount)
        let scaleFactor = v_rms / current_v_rms

        for (let i = 0; i < positions.length; i++) {
            if (!positions[i].isIon) {
                velocities[i].x *= scaleFactor
                velocities[i].y *= scaleFactor
            }
        }
    }

    ctx.clearRect(0, 0, htmlcanvas.width, htmlcanvas.height)

    for (let i = 0; i < N + n; i++) {
        drawCircle(V2(positions[i].x, positions[i].y), r * currentScale, { opacity: 1, color: (positions[i].isIon) ? "#d62728" : "#aec7e8" })
    }

    let voltage_text = text("V = " + V.toFixed(1) + "V").position(container.get_anchor("bottom-center").add(V2(0, -0.55))).fontsize(20).fontfamily("Math")

    drift_x += v_drift * dt
    let drift_points = []
    for (let i = 0; i < 10; i++) {
        drift_points.push(circle(0.1).strokewidth(0).fill("lightred").position(V2(((width / 10 * i + drift_x) % width) - width / 2, 4.2)))
    }

    draw(outline, stat, voltage_text, ...drift_points)
    requestAnimationFrame(update)
}

int.draw_function = (inp) => {

    draw(outline)
}

int.slider("V", 3, 10, 5, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " V")
int.slider("n", 50, 100, 70, 1, 10, (name, value) => name + " = " + value.toFixed(0))
int.slider("N", 300, 800, 400, 1, 10, (name, value) => name + " = " + value.toFixed(0))

resizeCanvas();

int.draw()
int.draw()

button.onclick = () => {
    positions = []
    velocities = []
    n_cache = 0
    N_cache = 0
    drift_x = 0
}

requestAnimationFrame(update)