import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, circle, V2, line, mod, linspace, curve, text, xyaxes, plotv
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

let canvas_tex = document.getElementById("tex");

let handletex = (str, conf) => {
    return MathJax.tex2svg(str, conf).innerHTML;
};

let draw_tex = (...diagrams) => {
    draw_to_svg_element(canvas_tex, diagram_combine(...diagrams));
    handle_tex_in_svg(canvas_tex, handletex);
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

function worldToScreen(x, y) {
    return {
        x: (x - world.left) / (world.right - world.left) * htmlcanvas.width,
        y: (world.top - y) / (world.top - world.bottom) * htmlcanvas.height
    };
}

function drawCircle(position, radius, options = {}) {
    const {
        strokeWidth = 2,
        color = "#aec7e8",
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

const x = -7
const y = 3

let history = [];
function getXAtTime(target_t) {
    if (history.length === 0 || target_t <= history[0].t) return x
    if (target_t >= history[history.length - 1].t) return history[history.length - 1].x

    for (let i = history.length - 1; i > 0; i--) {
        if (history[i - 1].t <= target_t && target_t <= history[i].t) {
            let dt_hist = history[i].t - history[i - 1].t;
            if (dt_hist === 0) return history[i].x
            let factor = (target_t - history[i - 1].t) / dt_hist
            return history[i - 1].x + factor * (history[i].x - history[i - 1].x)
        }
    }
    return x
}

function spring(p1, p2, radius = 1, coil_number = 10, separation_coefficient = 0.5, sample_number = 100) {
    let angle = p2.sub(p1).angle();
    let length = p2.sub(p1).length();
    let R = separation_coefficient;
    let n = coil_number;
    let k = radius / R; // k*R = radius
    let a = (2 * n + 1) * Math.PI;
    let b = (length - 2 * R) / a;
    let parametric_function = (t) => V2(b * t + R - R * Math.cos(t), k * R * Math.sin(t));
    let points = linspace(0, a, sample_number).map(parametric_function);
    return curve(points).rotate(angle).translate(p1);
}

const k = 20
const b = 20

const end_bound = 7

const resolution = 0.3

let bound = line(V2(x + 0.3, y), V2(x - 0.3, y)).apply(mod.subdivide(300))

let wall_top = line(V2(x - 0.5, y + 1.3), V2(-x + 0.5, y + 1.3)).strokewidth(3).stroke("gray")
let wall_bottom = line(V2(x - 0.5, y - 1.3), V2(-x + 0.5, y - 1.3)).strokewidth(3).stroke("gray")

let div1 = line(V2(-8, 1.5), V2(8, 1.5))
let div2 = line(V2(-8, -0.5), V2(8, -0.5))
let div3 = line(V2(-8, -3), V2(8, -3))

let ax_opt = {
    xrange: [0, end_bound - x],
    yrange: [-1.1, 1.1],
    yticks: [-0.5, 0.5],
    bbox: [V2(x, -2.9), V2(end_bound, -0.6)],
    headsize: 0.1
}
let ax = xyaxes(ax_opt).textfill("black").fontsize(20).fontfamily("Math").stroke("black").fill("black")
let ax2_opt = {
    xrange: [0, end_bound - x],
    yrange: [-0.35, 0.35],
    yticks: [-0.1, 0.1],
    bbox: [V2(x, -0.4), V2(end_bound, 1.4)],
    headsize: 0.1
}
let ax2 = xyaxes(ax2_opt).textfill("black").fontsize(20).fontfamily("Math").stroke("black").fill("black")

let disp_leg = text("χ (m)").fontfamily("Math").fontsize(20).position(V2(-7.5, 1.2))
let dist_leg = text("x (m)").fontfamily("Math").fontsize(20).position(V2(7.5, 0.5))

let disp_l = line(V2(0, 0), V2(0.5, 0)).stroke("lightblue").strokewidth(2).position(V2(-6.25, -4))
let part_l = circle(0.1).strokewidth(0).fill("lightblue").position(V2(-6, -3.4))
let dt_l = line(V2(0, 0), V2(0.5, 0)).stroke("red").strokewidth(2).position(V2(-0.7, -3.4))
let dx_l = line(V2(0, 0), V2(0.5, 0)).stroke("blue").strokewidth(2).position(V2(-0.7, -4))
let dt_t = text(", second derivative of displacement with respect to time").fontsize(20).fontfamily("Math").position(V2(3.93, -3.4))
let dx_t = text(", second derivative of displacement with respect to position").fontsize(20).fontfamily("Math").position(V2(4.12, -4))
let disp_t = text("Displacement of the particles").fontsize(20).fontfamily("Math").position(V2(-3.6, -4))
let part_t = text("Gas particles (representation)").fontsize(20).fontfamily("Math").position(V2(-3.53, -3.4))

let leg = diagram_combine(disp_l, dt_l, dx_l, dt_t, dx_t, part_l, disp_t, part_t).translate(V2(-1, 0))

let stat = diagram_combine(wall_top, wall_bottom, div1, div2, div3, ax, ax2, leg, disp_leg, dist_leg)

let velocity = V2(0, 0)
let position = V2(x, y)

let int = new Interactive(control, canvas);
let previousTime = performance.now()
function update(time) {
    let v = int.get("v")

    const dt = (time - previousTime) / 1000
    previousTime = time
    let t = time / 1000

    let sp = int.get("spring")

    let F = sp.sub(position).scale(k).sub(velocity.scale(b))
    velocity = velocity.add(F.scale(dt))
    position = position.add(velocity.scale(dt))
    position = V2(Math.min(Math.max(x - 0.4, position.x), x + 0.4), position.y)

    history.push({ t: t, x: position.x })

    const max_history_time = (end_bound - x) / v
    while (history.length > 0 && history[0].t < t - max_history_time - 0.5) {
        history.shift()
    }
    ctx.clearRect(0, 0, htmlcanvas.width, htmlcanvas.height)
    let particles = []
    for (let X = x + 0.3; X < end_bound; X += resolution) {
        for (let Y = y - 1.16; Y < y + 1.2; Y += resolution) {
            let displacement = getXAtTime(t - (X - x) / v) - x;
            drawCircle(V2(X + displacement, Y), 3);
        }
    }

    let pl = []
    for (let X = 0; X < end_bound - x; X += 0.05) {
        pl.push(V2(X, getXAtTime(t - X / v) - x))
    }
    let disp = plotv(pl, ax2_opt).stroke("lightblue").strokewidth(2)

    let wall = line(V2(position.x, y - 1.3), V2(position.x, y + 1.3)).stroke("gray").strokewidth(2)

    let particle = circle(0.1).strokewidth(0).fill("gray").position(position)
    let spring_diagram = spring(sp, position, 0.1, 2, 0.06, 100)

    let pl_d2x = []
    let pl_d2t = []
    let delta_t = 0.08
    let delta_x = delta_t * v

    for (let X = delta_x; X < end_bound - x - delta_x; X += 0.05) {
        let eval_time = t - X / v
        let D_current = getXAtTime(eval_time) - x

        let d2y_dx2 = (getXAtTime(t - (X + delta_x) / v) - x - 2 * D_current + getXAtTime(t - (X - delta_x) / v) - x) / (delta_x * delta_x);
        let d2y_dt2 = (getXAtTime(eval_time + delta_t) - x - 2 * D_current + getXAtTime(eval_time - delta_t) - x) / (delta_t * delta_t);

        pl_d2x.push(V2(X, d2y_dx2));
        pl_d2t.push(V2(X, d2y_dt2));
    }

    let disp_dt = plotv(pl_d2t, ax_opt).stroke("red").strokewidth(2)
    let disp_dx = plotv(pl_d2x, ax_opt).stroke("blue").strokewidth(2)

    draw(outline, spring_diagram, particle, ...particles, stat, wall, disp, disp_dt, disp_dx)
    requestAnimationFrame(update)
}

let outline = rectangle(16, 9).strokewidth(0);

let t1 = text("$\\frac{\\partial^2 \\chi}{\\partial t^2}$").fontsize(21 ).fontfamily("Math").position(V2(-0.7, -3.35))
let t2 = text("$\\frac{\\partial^2 \\chi}{\\partial x^2}$").fontsize(21).fontfamily("Math").position(V2(-0.7, -3.99))

let tex = diagram_combine(t1, t2)

int.draw_function = (inp) => {
    draw_tex(outline, tex)
    draw(outline)
}

int.locator("spring", V2(x, y), 0.2, "blue", bound)

int.slider("v", 1, 5, 3, 0.1, 10, (name, value) => "cₛ" + " = " + value.toFixed(1) + " m/s")

int.draw()
int.draw()

resizeCanvas();

requestAnimationFrame(update)