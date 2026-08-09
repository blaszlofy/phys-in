import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, line, xyaxes, circle, axes_transform, arrow1, text, Vdir, mod, annotation, axes_empty
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
    redraw()
}
window.addEventListener('resize', resizeCanvas);

const world = {
    left: -8,
    right: 8,
    bottom: -4.5,
    top: 4.5
};

function worldToScreen(x, y) {
    return {
        x: (x - world.left) / (world.right - world.left) * htmlcanvas.width,
        y: (world.top - y) / (world.top - world.bottom) * htmlcanvas.height
    };
}

function drawArrow(start, end, options = {}) {
    const {
        strokeWidth = 2,
        headSize = 12,
        color = "red",
        opacity = 1
    } = options;

    const p1 = worldToScreen(start.x, start.y)
    const p2 = worldToScreen(end.x, end.y)

    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const angle = Math.atan2(dy, dx)
    const distance = Math.hypot(dx, dy)

    ctx.save()

    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.globalAlpha = opacity

    ctx.translate(p1.x, p1.y)
    ctx.rotate(angle)

    const lineEnd = Math.max(0, distance - headSize)

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(lineEnd, 0)
    ctx.stroke()

    ctx.translate(distance, 0);

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-headSize, -headSize / 2)
    ctx.lineTo(-headSize, headSize / 2)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
}

const c = 10
const k = 100
let amount = 30
let charge_am = 40
const center = V2(-7.6, 0)
const max = 4

let ax1_opt = {
    xrange: [0, 80],
    yrange: [-40, 40],
    yticks: [],
    bbox: [V2(center.x, center.y - max), V2(center.x + 2 * max, center.y + max)],
    headsize: 0.1
}
let transf = axes_transform(ax1_opt)

let outline = rectangle(16, 9).strokewidth(0);

let ax1 = xyaxes(ax1_opt).stroke("black").fill("black").fontfamily("Math").fontsize(20).textfill("black")
let sheet = line(V2(center.x, center.y - max - 0.5), V2(center.x, center.y + max + 0.5)).strokewidth(0.25).stroke("lightgray").vectoreffect("none")
let z_l = text("z (m)").fontsize(20).fontfamily("Math").position(V2(center.x + 2 * max, center.y + 0.3))

let div1 = line(V2(1, 4.5), V2(1, -4.5))
let div2 = line(V2(1, -1.2), V2(8, -1.2))

let re = text("Re").fontsize(20).fontfamily("Math").position(V2(7.3, 2))
let im = text("Im").fontsize(20).fontfamily("Math").position(V2(4.9, 4.35))

let ch = circle(0.15).strokewidth(0).fill("lightred").position(V2(1.6, -1.6))
let ch_t = text("Positive electric charge").fontsize(20).fontfamily("Math").position(V2(3.3, -1.6))
let evec = arrow1(V2(0, 0), V2(0.5, 0), 0.05).fill("red").stroke("red").strokewidth(2).position(V2(1.35, -2.2))
let evec_t = text("Value of the electric field at a point").fontsize(20).fontfamily("Math").position(V2(4, -2.2))
let vec = arrow1(V2(0, 0), V2(0.5, 0), 0.1).fill("blue").stroke("blue").strokewidth(2).position(V2(1.35, -2.8))
let vec_t = text("Real part of the complex sum").fontsize(20).fontfamily("Math").position(V2(3.7, -2.8))
let vec_t2 = text("of the 'amplitude vectors'").fontsize(20).fontfamily("Math").position(V2(3.5, -3.2))

let leg = diagram_combine(ch, ch_t, evec, evec_t, vec, vec_t, vec_t2).translate(V2(0.8, -0.4))

let stat = diagram_combine(ax1, z_l, div1, div2, sheet, re, im, leg)

let int = new Interactive(control, canvas);

function normalize(value, maxValue) {
    return (value + maxValue) / (2 * maxValue);
}

function create_plane_wave_vectors(z, w, A, n, scale) {
    let vecs = []
    let curr = V2(0, 0)

    let wave_k = w / c
    let lambda = (2 * Math.PI) / wave_k
    let total_integration_distance = 21.31 * lambda

    let dr = total_integration_distance / n

    for (let i = 0; i <= n; i++) {
        let r = z + i * dr
        let mag = A * (z / r) * dr * scale

        let angle = -wave_k * (r + dr / 2)
        let next = curr.add(V2(mag, 0).rotate(angle))
        vecs.push(arrow1(curr, next, 0.02).stroke("black").fill("black").strokewidth(1))

        curr = next
    }

    let true_center_mag = (A * scale) / wave_k
    let true_center_angle = -wave_k * z - (Math.PI / 2)
    let true_center = V2(true_center_mag, 0).rotate(true_center_angle)

    return {
        diagram: diagram_combine(...vecs),
        end: true_center
    };
}

let x_cache = 0
let w_cache = 0
let A_cache = 0
let spiral_base_diagram = null;
let spiral_base_end = null;
int.draw_function = (inp) => {
    ctx.clearRect(0, 0, htmlcanvas.width, htmlcanvas.height);

    let A = inp["x₀"]
    let w = inp["ω"]
    let t = inp["t"]
    let coord_x = ((inp["pos"].x - center.x) / (max * 2)) * 80

    let y = (time) => A * Math.cos(w * time)
    let v_y = (time) => -A * w * Math.sin(w * time)

    let charges = []
    for (let i = 0; i <= charge_am; i++) {
        let pos = -42.5 + 85 / charge_am * i
        charges.push(circle(0.05).strokewidth(0).fill("lightred").position(V2(0, pos + y(t)).apply(transf)))
    }

    let step_x = (ax1_opt.xrange[1] - ax1_opt.xrange[0]) / amount
    let step_y = (ax1_opt.yrange[1] - ax1_opt.yrange[0]) / amount

    for (let x = ax1_opt.xrange[0]; x <= ax1_opt.xrange[1]; x += step_x) {
        for (let y = ax1_opt.yrange[0]; y <= ax1_opt.yrange[1]; y += step_y) {
            if (x < 20) continue
            if (x > 75) continue

            let E_max = k / c * A * w

            let E = -k / c * v_y(t - x / c)

            let start_pos = V2(x, y).apply(transf);
            let end_pos = V2(x, y).add(V2(0, 0.05).scale(E)).apply(transf);
            drawArrow({x: start_pos.x, y: start_pos.y}, {x: end_pos.x, y: end_pos.y}, {strokeWidth: 2, headSize: 6, color: "#d62728", opacity: normalize(E, E_max)})
        }
    }

    if (x_cache !== coord_x || w_cache !== w || A_cache !== A) {
        let result = create_plane_wave_vectors(coord_x, w, A, 100, 0.25)
        spiral_base_diagram = result.diagram
        spiral_base_end = result.end
        x_cache = coord_x
        w_cache = w
        A_cache = A
    }

    let spiral_center = V2(4.5, 1.8)
    let time_angle = w * t
    let spiral = spiral_base_diagram.rotate(time_angle).position(spiral_center)
    let rotated_end = spiral_base_end.rotate(time_angle)
    let resultant = arrow1(spiral_center, spiral_center.add(rotated_end), 0.1).strokewidth(2).fill("red").stroke("red")
    let projection = arrow1(spiral_center, spiral_center.add(V2(rotated_end.x, 0)), 0.1).strokewidth(3).fill("blue").stroke("blue")

    let ax2 = axes_empty({headsize: 0.1, bbox: [V2(-2.5, -2.5), V2(2.5, 2.5)]}).position(spiral_center).fill("black").strokewidth(1).stroke("black")

    let P = text("P").fontfamily("Math").fontsize(20).position(inp["pos"].add(V2(0, 0.5)))

    draw(outline, stat, ...charges, ax2, spiral, resultant, projection, P)
}

int.slider("t", 0, 10, 0, 0.04, 10, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("x₀", 1, 1.5, 1, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " m")
int.slider("ω", 3, 4, 3, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " rad/s")

int.locator("pos", V2(-3, 2), 0.2, "red", null, true, null, {type: "rect", min: center.add(V2(2, -max + 0.3)), max: center.add(V2(1.9 * max, max - 0.3))})

int.draw()
int.draw()

function redraw() {
    int.draw()
}
resizeCanvas();