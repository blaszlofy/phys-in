import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, circle, V2, line, mod, linspace, curve, text
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

const y = 1.5

let history = [];
function getYAtTime(target_t) {
    if (history.length === 0 || target_t <= history[0].t) return y
    if (target_t >= history[history.length - 1].t) return history[history.length - 1].y

    for (let i = history.length - 1; i > 0; i--) {
        if (history[i - 1].t <= target_t && target_t <= history[i].t) {
            let dt_hist = history[i].t - history[i - 1].t;
            if (dt_hist === 0) return history[i].y
            let factor = (target_t - history[i - 1].t) / dt_hist
            return history[i - 1].y + factor * (history[i].y - history[i - 1].y)
        }
    }
    return y
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

const k = 50
const b = 20
const v = 3
const wall_x = 0
const left_bound = -7
const resolution = 300

let bound = line(V2(7, -1.3 + y), V2(7, 1.3 + y)).apply(mod.subdivide(300))
let wall = line(V2(0, y - 2), V2(0, y + 2)).strokewidth(3).stroke("gray")
let div = line(V2(-8, -2), V2(8, -2))

let r_l_sum = line(V2(0, 0), V2(0.5, 0)).strokewidth(3).position(V2(-2, -2.6))
let g1_l_sum = line(V2(0, 0), V2(0.5, 0)).strokewidth(1.5).strokedasharray([10]).stroke("lightblue").position(V2(-3.5, -2.6))
let g2_l_sum = line(V2(0, 0), V2(0.5, 0)).strokewidth(1.5).strokedasharray([10]).stroke("lightred").position(V2(-5, -2.6))
let plus = text("+").fontfamily("Math").fontsize(20).position(V2(-4, -2.6))
let equal = text("=").fontfamily("Math").fontsize(20).position(V2(-2.5, -2.6))

let g_l = line(V2(0, 0), V2(0.5, 0)).strokewidth(1.5).strokedasharray([10]).stroke("gray").position(V2(-5, -3.8))
let r_l = line(V2(0, 0), V2(0.5, 0)).strokewidth(3).position(V2(-5, -3.2))
let r_t = text("Physical string: fixed to the wall at one end, moved at the other to generate waves").fontsize(20).fontfamily("Math").position(V2(0.5, -3.2))
let g_t = text("Incident and reflected waves (their superposition equals the actual displacement)").fontsize(20).fontfamily("Math").position(V2(0.56, -3.8))

let leg = diagram_combine(r_l_sum, g1_l_sum, g2_l_sum, plus, equal, g_l, r_l, r_t, g_t).translate(V2(-0.1, 0))

let velocity = V2(0, 0)
let position = V2(7, y)

let previousTime = performance.now()
function update(time) {
    const dt = (time - previousTime) / 1000
    previousTime = time
    let t = time / 1000

    let sp = int.get("spring")

    let F = sp.sub(position).scale(k).sub(velocity.scale(b))
    velocity = velocity.add(F.scale(dt))
    position = position.add(velocity.scale(dt))
    position = V2(position.x, Math.sign(position.y) * Math.min(Math.abs(position.y), 3))

    history.push({ t: t, y: position.y })

    const max_history_time = (position.x - left_bound) / v
    while (history.length > 0 && history[0].t < t - max_history_time - 0.5) {
        history.shift()
    }

    let particle = circle(0.1).strokewidth(0).fill("gray").position(position)
    let spring_diagram = spring(sp, position, 0.1, 6, 0.07, 200)

    let rope_points = []
    let ghost1 = []
    let ghost2 = []

    const domain_width = position.x - left_bound
    for (let i = 0; i <= resolution; i++) {
        let curr_x = position.x - i * (domain_width / resolution)
        let dist_incident = position.x - curr_x

        let dist_reflected = position.x + curr_x

        let t_emit1 = t - (dist_incident / v)
        let t_emit2 = t - (dist_reflected / v)

        let y_hist1 = getYAtTime(t_emit1)
        let y_hist2 = getYAtTime(t_emit2)

        let disp1 = y_hist1 - y
        let disp2 = -(y_hist2 - y)

        ghost1.push(V2(curr_x, disp1 + y))
        ghost2.push(V2(curr_x, disp2 + y))

        if (curr_x >= wall_x) {
            rope_points.push(V2(curr_x, disp1 + disp2 + y))
        }
    }

    let g1 = curve(ghost1).stroke("lightblue").strokewidth(1.5).strokedasharray([10])
    let g2 = curve(ghost2).stroke("lightred").strokewidth(1.5).strokedasharray([10])
    let rope = curve(rope_points).stroke("black").strokewidth(3)

    let stick = line(V2(7, position.y - 1.5), V2(7, position.y + 1.5)).stroke("gray").strokewidth(2)

    draw(outline, g1, g2, rope, spring_diagram, particle, wall, stick, div, leg)
    requestAnimationFrame(update)
}

let outline = rectangle(16, 9).strokewidth(0);

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {

    draw(outline)
}

int.locator("spring", V2(7, y), 0.2, "blue", bound)

int.draw()
int.draw()

requestAnimationFrame(update)