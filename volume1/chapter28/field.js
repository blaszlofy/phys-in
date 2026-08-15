import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, circle, linspace, curve, arrow1
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

const c = 10
const k = 100
const b = 50
const m = 1
const SCALE = 1
let max_his_time  = 19 / c
const step = 0.5

let int = new Interactive(control, canvas);

function getRetardedTime(r, currentTimeSec) {
    for (let i = history.length - 1; i > 0; i--) {
        let h_new = history[i]
        let h_old = history[i - 1]

        let t_travel_new = r.sub(h_new[1]).length() / c
        let t_travel_old = r.sub(h_old[1]).length() / c

        let dt_actual_new = currentTimeSec - h_new[0]
        let dt_actual_old = currentTimeSec - h_old[0]

        if (dt_actual_new <= t_travel_new && dt_actual_old >= t_travel_old) {
            let D_new = dt_actual_new - t_travel_new
            let D_old = dt_actual_old - t_travel_old
            let fraction = D_old / (D_old - D_new)
            return [h_old[0] + fraction * (h_new[0] - h_old[0])]
        }
    }
    return history[0]
}

function getInterpolatedValues(t, data) {
    if (data.length === 0) return 0;
    if (t <= data[0][0]) return {
        pos: data[0][1],
        vel: data[0][2],
        acc: data[0][3],
    }
    if (t >= data[data.length - 1][0]) return {
        pos: data[data.length - 1][1],
        vel: data[data.length - 1][2],
        acc: data[data.length - 1][3],
    };

    for (let i = 0; i < data.length - 1; i++) {
        let p1 = data[i];
        let p2 = data[i + 1];

        if (t >= p1[0] && t <= p2[0]) {
            let fraction = (t - p1[0]) / (p2[0] - p1[0]);
            return {
                pos: (p2[1].sub(p1[1]).scale(fraction).add(p1[1])),
                vel: (p2[2].sub(p1[2]).scale(fraction).add(p1[2])),
                acc: (p2[3].sub(p1[3]).scale(fraction).add(p1[3])),
            }
        }
    }

    return 0;
}

let history = []
let previous_velocity = V2(0, 0)

//SPRING SYSTEM WITH RELATIVITY
let position = V2(0, 0)
let velocity = V2(0, 0)
let momentum = V2(0, 0)


//TODO: RANDOM BIG ARROWS; CLAMP POSITION
let previousTime = performance.now()
function update(time) {
    let sp = int.get("spring")
    let K = int.get("K") / 10
    let zoom = 1 / (int.get("zoom") / 10)

    world.left = -8 * zoom
    world.right = 8 * zoom
    world.bottom = -4.5 * zoom
    world.top = 4.5 * zoom

    max_his_time = Math.sqrt(Math.pow(16 * zoom, 2) + Math.pow(9 * zoom, 2)) / c * 1.1

    const dt = (time - previousTime) / 1000
    previousTime = time
    previous_velocity = velocity

    let F = sp.sub(position).scale(k).sub(velocity.scale(b))
    momentum = momentum.add(F.scale(dt))
    velocity = momentum.scale(1 / (m * Math.sqrt(1 + (momentum.length() / (m * c)) ** 2)))
    position = position.add(velocity.scale(dt))

    let acceleration = velocity.sub(previous_velocity).scale(1 / dt)

    let currentTimeSec = time / 1000
    history.push([currentTimeSec, position, velocity, acceleration])

    while (history.length > 2 && (currentTimeSec - history[0][0]) > max_his_time) {
        history.shift()
    }

    let charge = circle(0.2).strokewidth(0).fill("lightred").position(position)
    let spring_diagram = spring(position, sp, 0.15, 10, 0.05, 100)

    let current_step = step * zoom

    ctx.clearRect(0, 0, htmlcanvas.width, htmlcanvas.height);
    for (let x = world.left; x <= world.right; x += current_step) {
        for (let y = world.bottom; y <= world.top; y += current_step) {
            let r = V2(x, y).scale(SCALE)
            if (r.sub(position).length() < current_step * 2) continue


            //ALL VARIABLES FOR LIÉNARD WIECHERT
            let tr = getRetardedTime(r, currentTimeSec)[0]
            let state_r = getInterpolatedValues(tr, history)
            let rr = state_r.pos
            let vr = state_r.vel
            let ar = state_r.acc
            let R = r.sub(rr)
            let n = R.normalize()
            R = R.length()
            let beta = vr.scale(1 / c)
            let beta_dot = ar.scale(1 / c)
            let gamma = 1 / Math.sqrt(1 - beta.length_sq())

            //ACTUAL LIÉNARD WIECHERT IN ONE LINE
            let E = (n.sub(beta).scale(1 / (gamma**2 * (1 - beta.dot(n))**3 * R**2)).add((n.sub(beta)).scale(n.dot(beta_dot)).sub(beta_dot.scale(n.dot(n.sub(beta)))).scale(1 / (c * (1 - beta.dot(n))**3 * R)))).scale(K)

            drawArrow(r, r.add(E), {strokeWidth: 2, headSize: 6, color: "#d62728"})
        }
    }

    draw(rectangle(16 * zoom, 9 * zoom), spring_diagram, charge)

    int.draw()

    requestAnimationFrame(update)
}

int.locator("spring", V2(0, 0), 0.2, "red", null, true, null, {type: "rect", min: V2(-5, -3), max: V2(5, 3)})
int.locator_initial_draw()

int.slider("K", 2, 30, 10, 1, 10, (name, value) => "q = " + value / 10 + " C")
int.slider("zoom", 4, 10, 10, 1, 10, (name, value) => "Zoom = " + value / 10 )

resizeCanvas();

requestAnimationFrame(update)