import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, line, xyaxes, circle, axes_transform, arrow1, text, Vdir, mod, annotation, to_radian
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
const dist = 13
const radius = 3.6
const center = V2(3, 0)
const max = 4.2
const dy = 5

let ax1_opt = {
    xrange: [-40, 40],
    yrange: [-40, 40],
    bbox: [V2(center.x - max, center.y - max), V2(center.x + max, center.y + max)],
    headsize: 0.1
}
let transf = axes_transform(ax1_opt)

let outline = rectangle(16, 9).strokewidth(0);

let ax1 = xyaxes(ax1_opt).stroke("black").fill("black").fontfamily("Math").fontsize(20).textfill("black")

let ch = circle(0.15).strokewidth(0).fill("lightred").position(V2(-6.9, 4))
let ch_t = text("Positive electric charge").fontsize(20).fontfamily("Math").position(V2(-5.2, 4))
let evec = arrow1(V2(0, 0), V2(0.5, 0), 0.05).fill("red").stroke("red").strokewidth(2).position(V2(-7.15, 3.1))
let evec_t = text("Value of the electric field at a point").fontsize(20).fontfamily("Math").position(V2(-4.4, 3.1))
let D = circle(0.08).strokewidth(0).fill("red").position(V2(-6.9, 2.2))
let D2 = circle(0.2).strokewidth(0).fill("lightred").position(V2(-6.9, 2.2))
let D_t = text("Point D").fontsize(20).fontfamily("Math").position(V2(-6, 2.2))
let evec2 = arrow1(V2(0, 0), V2(0.5, 0), 0.05).fill("green").stroke("green").strokewidth(2).position(V2(-7.15, 1.3))
let evec2_t = text("Value of the electric field at point D").fontsize(20).fontfamily("Math").position(V2(-4.4, 1.3))
let evec2_t2 = text("(scaled up for visibility)").fontsize(20).fontfamily("Math").position(V2(-5, 0.9))


let x_l = text("x (m)").fontsize(20).fontfamily("Math").position(V2(center.x + max, center.y + 0.3))
let y_l = text("y (m)").fontsize(20).fontfamily("Math").position(V2(center.x + 0.5, center.y + max - 0.15))

let bound = circle(radius).position(center).apply(mod.subdivide(200))

let stat = diagram_combine(ax1, x_l, y_l, line(V2(2.4 - max, 4.5), V2(2.4 - max, -4.5)))
let leg = diagram_combine(ch, ch_t, evec, evec_t, evec2, evec2_t, evec2_t2, D2, D, D_t).translate(V2(0, -2.4))

let int = new Interactive(control, canvas);

function normalize(value, maxValue) {
    return (value + maxValue) / (2 * maxValue);
}

int.draw_function = (inp) => {
    ctx.clearRect(0, 0, htmlcanvas.width, htmlcanvas.height);

    let A = inp["A"]
    let w = inp["ω"]
    let t = inp["t"]
    let pos = inp["pos"]
    let phase = to_radian(inp["θ"])

    let y1 = (time) => A * Math.sin(w * time) + dy
    let a_y1 = (time) => - A * w**2 * Math.sin(w * time)
    let y2 = (time) => A * Math.sin(w * time + phase) - dy
    let a_y2 = (time) => - A * w**2 * Math.sin(w * time + phase)

    let charge1 = circle(0.15).strokewidth(0).fill("lightred").position(V2(0, y1(t)).apply(transf))
    let charge2 = circle(0.15).strokewidth(0).fill("lightred").position(V2(0, y2(t)).apply(transf))

    let step_x = (ax1_opt.xrange[1] - ax1_opt.xrange[0]) / amount
    let step_y = (ax1_opt.yrange[1] - ax1_opt.yrange[0]) / amount

    for (let x = ax1_opt.xrange[0]; x <= ax1_opt.xrange[1]; x += step_x) {
        for (let y = ax1_opt.yrange[0]; y <= ax1_opt.yrange[1]; y += step_y) {
            let r1 = V2(x, y - dy).length()
            let r2 = V2(x, y + dy).length()

            if (V2(x, y).length() < dist) continue
            if (r1 > ax1_opt.xrange[1] || r1 > ax1_opt.yrange[1] || r2 > ax1_opt.xrange[1] || r2 > ax1_opt.yrange[1]) continue

            let dir1 = V2(x, y - dy).angle()
            let dir2 = V2(x, y + dy).angle()

            let E_max = -(k / (c**2 * r1)) * A * w**2 * Math.cos(dir1) + -(k / (c**2 * r2)) * A * w**2 * Math.cos(dir2)

            let E = -(k / (c**2 * r1)) * a_y1(t - r1 / c) * Math.cos(dir1) + -(k / (c**2 * r2)) * a_y2(t - r2 / c) * Math.cos(dir2)

            let center_dir = V2(x, y).angle();
            let start_pos = V2(x, y).apply(transf);
            let end_pos = V2(x, y).add(Vdir(center_dir + Math.PI / 2).scale(E)).apply(transf);
            drawArrow({x: start_pos.x, y: start_pos.y}, {x: end_pos.x, y: end_pos.y}, {strokeWidth: 2, headSize: 6, color: "#d62728", opacity: normalize(E, E_max)})
        }
    }

    let px = (pos.x - center.x) * (40 / max)
    let py = (pos.y - center.y) * (40 / max)

    let dir1 = V2(px, py - dy).angle()
    let dir2 = V2(px, py + dy).angle()
    let r1 = V2(px, py - dy).length()
    let r2 = V2(px, py + dy).length()

    let E = -(k / (c**2 * r1)) * a_y1(t - r1 / c) * Math.cos(dir1) + -(k / (c**2 * r2)) * a_y2(t - r2 / c) * Math.cos(dir2)

    let ln = line(pos, center).stroke("gray").strokedasharray([10]).strokewidth(2)
    let center_dir = pos.sub(center).angle()
    let end_pos = pos.add(Vdir(center_dir + Math.PI / 2).scale(E))
    let E_vec = arrow1(pos, end_pos, 0.05).fill("green").stroke("green").strokewidth(2)

    draw(outline, stat, ln, charge1, charge2, E_vec, leg)
}

int.slider("t", 0, 10, 0, 0.02, 10, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("θ", 0, 180, 180, 1, 10, (name, value) => name + " = " + value.toFixed(0) + "°")
int.slider("A", 1, 1.5, 1, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " m")
int.slider("ω", 3,  6, 6, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " rad/s")

int.locator("pos", V2(5, 2), 0.2, "red", bound)

int.draw()
int.draw()

function redraw() {
    int.draw()
}
resizeCanvas();