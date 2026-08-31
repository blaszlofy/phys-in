import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, curve, line, xyaxes, xycorneraxes, plotv, plotf, xtickmark, bar, ytickmark_empty, text, TAG
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
        x: xOffset + 9 + (x - world.left) * currentScale,  //+9 is needed, somehow the two canvases are offset...
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

function randomGaussian() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

const k = 1
const depth = 0.75
const V = 17
const center = V2(-6, -0.3)
const res = 20

let div1 = line(V2(0.5, 4.5), V2(0.5, -4.5))
let div2 = line(V2(0.5, -1), V2(8, -1))

let h_t = text("h (m)").fontfamily("Math").fontsize(20).position(V2(-2.8, 4))
let n_t2 = text("n").fontfamily("Math").fontsize(20).position(V2(0.1, -4.25))
let n_t = text("n").fontfamily("Math").fontsize(20).position(V2(1.1, 3.8))
let v_t = text("v (m/s)").fontfamily("Math").fontsize(20).position(V2(7.55, -0.5))

let vel_t = text("Velocity histogram").fontfamily("Math").fontsize(20).position(V2(4.5, 4))

let desc_1 = text("The simulated 'atmosphere'").fontfamily("Math").fontsize(20).position(V2(4, -1.5))
let desc_2 = text("is in thermal equilibrium, meaning").fontfamily("Math").fontsize(20).position(V2(4.4, -2))
let desc_3 = text("temperature is independent of height").fontfamily("Math").fontsize(20).position(V2(4.57, -2.5))
let desc_4 = text("unlike in Earth's atmosphere").fontfamily("Math").fontsize(20).position(V2(4.08, -3))

let leg = diagram_combine(desc_1, desc_2, desc_3, desc_4).translate(V2(-0.3, -0.45))

let stat = diagram_combine(div1, div2, v_t, n_t, n_t2, h_t, leg, vel_t)

let outline = rectangle(16, 9).strokewidth(0);

let int = new Interactive(control, canvas);

let positions = []
let velocities = []
let N_cache = 0
let T_cache = -1

let previousTime = performance.now()
function update(time) {
    let m = int.get("m") / 100 / 5
    let g = int.get("g")
    let N = int.get("N")
    let T = int.get("T") / 10

    let v_rms = Math.sqrt(3 * k * T / m)

    const dt = Math.min((time - previousTime) / 1000, 0.05)
    previousTime = time
    let t = time / 1000

    let zArea = V / depth
    let width = Math.cbrt(V) * 1.2 //just random constant
    let height = zArea / width
    let yArea = depth * width
    let xArea = depth * height
    let area = 2 * (zArea + yArea + xArea)

    if (N !== N_cache) {
        if (N > N_cache) {
            for (let i = N_cache; i < N; i++) {
                positions.push({
                    x: center.x + (Math.random() - 0.5) * width,
                    y: center.y + (Math.random() - 0.5) * height,
                    z: (Math.random() - 0.5) * depth
                })

                let z_dir = Math.random() * 2 - 1
                let theta = Math.random() * 2 * Math.PI
                let xy_mag = Math.sqrt(1 - z_dir * z_dir)

                velocities.push({
                    x: xy_mag * Math.cos(theta) * v_rms,
                    y: xy_mag * Math.sin(theta) * v_rms,
                    z: z_dir * v_rms
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
            let old_v_rms = Math.sqrt(3 * k * T_cache / m)
            let speedRatio = v_rms / old_v_rms

            for (let i = 0; i < N; i++) {
                let v = velocities[i]
                v.x *= speedRatio
                v.y *= speedRatio
                v.z *= speedRatio
            }
        }
        T_cache = T
    } //change speeds if T is modified

    let r = 0.04
    let hw = width / 2
    let hh = height / 2
    let hd = depth / 2

    for (let i = 0; i < N; i++) {
        let p = positions[i]
        let v = velocities[i]

        p.x += v.x * dt
        p.y += v.y * dt
        p.z += v.z * dt

        if (p.x < center.x - hw) {
            p.x = center.x - hw
            v.x = Math.abs(v.x)
        } else if (p.x > center.x + hw) {
            p.x = center.x + hw
            v.x = -Math.abs(v.x)
        }

        if (p.y < center.y - hh + r) {
            p.y = center.y - hh + r

            let v_th = Math.sqrt(k * T / m)
            v.x = randomGaussian() * v_th
            v.z = randomGaussian() * v_th

            let u = Math.random();
            while(u === 0) u = Math.random(); // Prevent log(0)
            v.y = Math.sqrt(-2 * v_th * v_th * Math.log(u));

        } else if (p.y > center.y + hh - r) { // Added - r here too
            p.y = center.y + hh - r
            v.y = -Math.abs(v.y)
        }
        if (p.z < -hd) {
            p.z = -hd
            v.z = Math.abs(v.z)
        } else if (p.z > hd) {
            p.z = hd
            v.z = -Math.abs(v.z)
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
            let dz = p1.z - p2.z

            let distSq = dx * dx + dy * dy + dz * dz

            if (distSq < 4 * r * r) {
                let dist = Math.sqrt(distSq)

                let nx = dx / dist
                let ny = dy / dist
                let nz = dz / dist

                let dvx = v1.x - v2.x
                let dvy = v1.y - v2.y
                let dvz = v1.z - v2.z

                let dotProduct = dvx * nx + dvy * ny + dvz * nz

                if (dotProduct < 0) {
                    v1.x -= dotProduct * nx
                    v1.y -= dotProduct * ny
                    v1.z -= dotProduct * nz

                    v2.x += dotProduct * nx
                    v2.y += dotProduct * ny
                    v2.z += dotProduct * nz
                }

                let overlap = 2 * r - dist
                let moveX = nx * overlap / 2
                let moveY = ny * overlap / 2
                let moveZ = nz * overlap / 2

                p1.x += moveX
                p1.y += moveY
                p1.z += moveZ

                p2.x -= moveX
                p2.y -= moveY
                p2.z -= moveZ
            }
        }
    } //collision between particles

    for (let i = 0; i < N; i++) {
        let v = velocities[i]
        v.y -= g * dt
    } //gravity

    let max_bins = 20
    let velocity_histogram = new Array(max_bins).fill(0)
    let max_expected_speed = 30
    let bin_width = max_expected_speed / max_bins

    for (let i = 0; i < N; i++) {
        let v = velocities[i]
        let speed = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)

        let bin = Math.floor(speed / bin_width)
        if (bin >= max_bins) bin = max_bins - 1

        velocity_histogram[bin]++
    }

    let counts = new Array(res).fill(0)
    let bottomY = center.y - hh
    let sliceHeight = height / res

    for (let i = 0; i < N; i++) {
        let p = positions[i]
        let idx = Math.floor((p.y - bottomY) / sliceHeight)

        if (idx >= 0 && idx < res) {
            counts[idx]++
        }
    }

    ctx.clearRect(0, 0, htmlcanvas.width, htmlcanvas.height)
    let drawIndices = Array.from({length: N}, (_, i) => i)
    drawIndices.sort((a, b) => positions[a].z - positions[b].z)

    for (let i = 0; i < N; i++) {
        let p = positions[drawIndices[i]]

        let zNormalized = (p.z + (depth / 2)) / depth
        zNormalized = Math.max(0, Math.min(1, zNormalized))

        let op = 0.5 + (0.5 * zNormalized)

        drawCircle(V2(p.x + depth * (1 - zNormalized), p.y + depth * (1 - zNormalized)), r * currentScale, { opacity: op })
    }

    const delta = 0.3
    let container = rectangle(width + delta, height + delta).position(center).strokewidth(3).stroke("gray")
    const dP = V2(depth, depth)
    let outer = diagram_combine(
        curve([
            container.get_anchor("top-left"),
            container.get_anchor("top-left").add(dP),
            container.get_anchor("top-right").add(dP),
            container.get_anchor("bottom-right").add(dP),
            container.get_anchor("bottom-right")
        ]),
        line(container.get_anchor("top-right"), container.get_anchor("top-right").add(dP))
    ).stroke("gray").strokewidth(2)
    let inner = diagram_combine(
        curve([
            container.get_anchor("top-left").add(dP),
            container.get_anchor("bottom-left").add(dP),
            container.get_anchor("bottom-right").add(dP)
        ]),
        line(container.get_anchor("bottom-left"), container.get_anchor("bottom-left").add(dP))
    ).stroke("gray").strokewidth(1.1)

    let bar_opt = {
        gap: 0,
        bbox: [V2(0, 0), V2(height + delta, 3)],
        yrange: [0, 400],
    }
    let ax_opt = {
        xrange: [-1, counts.length],
        yrange: bar_opt.yrange,
        bbox: bar_opt.bbox,
        xticks: [],
        yticks: [100, 200, 300, 400],
        headsize: 0.1
    }
    let decayFactor = Math.exp(-m * g * sliceHeight / (k * T))
    let C = N * (1 - decayFactor)

    let distribution_plot = bar.plot(counts, bar_opt).stroke("blue").fill("lightblue").opacity(0.5)
    let dist_ax = xycorneraxes(ax_opt).stroke("black").fill("black").textfill("black").fontsize(20).fontfamily("Math")
        .apply_to_tagged_recursive(TAG.GRAPH_TICK_LABEL, d => d.translate(V2(-0.2, 0.25)))
    let distribution_theo_plot = plotf(x => C * Math.exp(-m * g * (x * sliceHeight) / (k * T)), ax_opt).stroke("gray").strokewidth(2).strokedasharray([10])

    let plot_combined = diagram_combine(distribution_plot, dist_ax, distribution_theo_plot).move_origin("bottom-center").hflip().rotate(-Math.PI / 2).position(center.add(V2(width, 0)))

    let bar_opt2 = {
        gap: 0,
        bbox: [V2(1.3, -0.5), V2(7, 3.5)],
        yrange: [0, Math.max(500, Math.max(...velocity_histogram))],
    }
    let hist_plot = bar.plot(velocity_histogram, bar_opt2).stroke("blue").fill("lightblue").opacity(0.5)
    let hist_ax = bar.yaxes(velocity_histogram, bar_opt2).stroke("black").fontsize(20).fontfamily("Math").textfill("black")

    function maxwellBoltzmann(x) {
        const v = x * bin_width

        const a = m / (2 * Math.PI * k * T)
        const probabilityDensity = 4 * Math.PI * Math.pow(a, 1.5) * v * v * Math.exp((-m * v * v) / (2 * k * T))

        return N * bin_width * probabilityDensity
    }

    let theo_dist = plotf(x => maxwellBoltzmann(x), {
        bbox: bar_opt2.bbox,
        yrange: bar_opt2.yrange,
        xrange: [0, velocity_histogram.length]
    }).stroke("gray").strokewidth(2).strokedasharray([10])

    draw(outline, stat, container, outer, inner, plot_combined, hist_plot, hist_ax, theo_dist)
    requestAnimationFrame(update)
}

int.draw_function = (inp) => {

    draw(outline)
}

int.slider("g", 5, 15, 10, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " m/s²")
int.slider("m", 400, 700, 531, 1, 10, (name, value) => name + " = " + (value / 100).toFixed(2) + " ⋅ 10⁻²⁶ kg")
int.slider("N", 600, 1000, 700, 1, 10, (name, value) => name + " = " + value.toFixed(0))
int.slider("T", 200, 350, 273, 1, 10, (name, value) => name + " = " + value.toFixed(1) + " K")

resizeCanvas();

int.draw()
int.draw()

requestAnimationFrame(update)