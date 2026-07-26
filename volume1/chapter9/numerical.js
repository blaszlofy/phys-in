import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, V2, xyaxes, line, plotv, plotf, text, square, axes_transform, linspace, curve, arrow1, xycorneraxes,
    circle,
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

const x0 = 1
const v0 = 0

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

function oscillator(position, velocity, actual_pos, block_color = "lightblue", arrow_color = "gray", darken) {
    let top = line(V2(-1, 0), V2(1, 0)).strokewidth(3).stroke("lightgray")
    let pos = V2(0, -2.25 + 0.5 * position)
    if (velocity + pos.y > 0 || velocity + pos.y < -4.5 || darken) {
        velocity = 0
    }
    let vel = arrow1(pos, pos.add(V2(0, velocity)), 0.1).strokewidth(2).stroke(arrow_color).fill(arrow_color)
    let spr = spring(V2(0, 0), pos, 0.15, 10, 0.05, 100)
    let block = rectangle(0.8, 0.4).fill(block_color).strokewidth(0).position(pos)
    let osc = diagram_combine(spr, top, vel, block).position(actual_pos).mut()
    if (darken) {
        osc.fill("#e1e1e1").stroke("#e1e1e1")
    }
    return {diagram: osc, block_pos: pos.add(actual_pos)}
}

function getInterpolatedValue(t, data) {
    if (data.length === 0) return 0;
    if (t <= data[0].x) return data[0].y;
    if (t >= data[data.length - 1].x) return data[data.length - 1].y;

    for (let i = 0; i < data.length - 1; i++) {
        let p1 = data[i];
        let p2 = data[i + 1];

        if (t >= p1.x && t <= p2.x) {
            let fraction = (t - p1.x) / (p2.x - p1.x);
            return p1.y + fraction * (p2.y - p1.y);
        }
    }

    return 0;
}

function getWholeNumerical(eps, range) {
    let step_amount = Math.floor(range / eps)
    let positions = [x0]
    let velocities = [v0]
    let vel_data = [V2(0, v0)]
    let pos_data = [V2(0, x0)]
    for (let i = 1; i <= step_amount; i++) {
        let p_new = positions[i - 1] + eps * velocities[i - 1]
        positions[i] = p_new
        let v_new = velocities[i - 1] - eps * positions[i - 1]
        velocities[i] = v_new
        let cur_time = eps * i
        vel_data[i] = V2(cur_time, v_new)
        pos_data[i] = V2(cur_time, p_new)
    }
    return {positions: pos_data, velocities: vel_data}
}

function getHalfNumerical(eps, range) {
    let step_amount = Math.floor(range / eps)
    let v_halfeps = v0 - eps / 2 * x0
    let positions = [x0]
    let velocities = [v_halfeps]
    let vel_data = [V2(0, v_halfeps)]
    let pos_data = [V2(0, x0)]
    for (let i = 1; i <= step_amount; i++) {
        let p_new = positions[i - 1] + eps * velocities[i - 1]
        positions[i] = p_new
        let v_new = velocities[i - 1] - eps * p_new
        velocities[i] = v_new
        let cur_time = eps * i
        vel_data[i] = V2(cur_time + eps / 2, v_new)
        pos_data[i] = V2(cur_time, p_new)
    }
    return {positions: pos_data, velocities: vel_data}
}

//STATIC
let outline = rectangle(16, 9).strokewidth(0);
let div = line(V2(-8, 0), V2(8, 0))
let div2 = line(V2(1.5, 0), V2(1.5, 4.5))
let ax_opt = {
    xrange: [0, Math.PI * 4],
    yrange: [-3, 3],
    bbox: [V2(-7, -4.5), V2(7, -0.1)],
    headsize: 0.1
}
let transf = axes_transform(ax_opt)
let rul_opt = {
    xrange: [0, 0.001],
    yrange: [-4, 4],
    xticks: [0],
    yticks: [-3, -2, -1, 0, 1, 2, 3],
    bbox: [V2(-5, 0.25), V2(-5.01, 4.25)],
    headsize: 0
}
let rul_transf = axes_transform(rul_opt)
let ax = xyaxes(ax_opt).stroke("black").fill("black").textfill("black").fontfamily("Math").fontsize(20)
let rul = xycorneraxes(rul_opt).stroke("black").fill("black").textfill("black").fontfamily("Math").fontsize(20)

let t_leg = text("t (s)").fontfamily("Math").fontsize(20).position(V2(7, -2))
let x_leg = text("x (m)").fontfamily("Math").fontsize(20).position(V2(-7.5, -0.3))
let x_leg2 = text("x (m)").fontfamily("Math").fontsize(20).position(V2(-5, 4.45))

let exact_line = line(V2(0, 0), V2(0.5, 0)).strokewidth(2).strokedasharray([10]).position(V2(2.3, 3.6))
let half_line = line(V2(0, 0), V2(0.5, 0)).strokewidth(2).stroke("blue").opacity(0.5).position(V2(2.3, 2))
let whole_line = line(V2(0, 0), V2(0.5, 0)).strokewidth(2).stroke("red").opacity(0.5).position(V2(2.3, 3))

let exact_text = text('Exact analytical position of the mass').fontsize(20).fontfamily("Math").position(V2(5, 3.6))
let whole_text = text('Approximated position using the').fontsize(20).fontfamily("Math").position(V2(4.84, 3))
let whole_text2 = text('basic method (Euler)').fontsize(20).fontfamily("Math").position(V2(4.15, 2.6))
let half_text = text('Approximated position using the').fontsize(20).fontfamily("Math").position(V2(4.84, 2))
let half_text2 = text('ϵ/2 "trick" (Leapfrog)').fontsize(20).fontfamily("Math").position(V2(4.2, 1.6))

let statics = diagram_combine(div, div2, ax, t_leg, x_leg, x_leg2, rul, exact_line, half_line, whole_line, exact_text, whole_text, whole_text2, half_text, half_text2)

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let eps = inp["ϵ"] / 100 //slider values go from 1 to 100
    let t = inp["t"]

    let whole_data = getWholeNumerical(eps, ax_opt.xrange[1])
    let whole_pos = plotv(whole_data.positions, ax_opt).stroke("red").opacity((eps > 0.05) ? 0.5 : 1).strokewidth(2)
    let whole_points = []
    if (eps > 0.05) {
        for (let data of whole_data.positions) {
            if (data.y < ax_opt.yrange[0] || data.y > ax_opt.yrange[1]) continue
            whole_points.push(square(0.04).position(data.apply(transf)).strokewidth(0).fill("red"))
        }
    }

    let half_data = getHalfNumerical(eps, ax_opt.xrange[1])
    let half_pos = plotv(half_data.positions, ax_opt).stroke("blue").opacity((eps > 0.05) ? 0.5 : 1).strokewidth(2)
    let half_points = []
    if (eps > 0.05) {
        for (let data of half_data.positions) {
            if (data.y < ax_opt.yrange[0] || data.y > ax_opt.yrange[1]) continue
            half_points.push(square(0.04).position(data.apply(transf)).strokewidth(0).fill("blue"))
        }
    }

    let real_pos = plotf((x) => Math.cos(x), ax_opt).strokewidth(2).strokedasharray([10])

    let oscillator1 = oscillator(Math.cos(t), -Math.sin(t), V2(-6.5, 4.5), "gray")
    let osc1_diagram = oscillator1.diagram
    let osc1_line = line(oscillator1.block_pos, V2(-0.02, Math.cos(t)).apply(rul_transf)).strokewidth(2).strokedasharray([10])

    let pos2 = getInterpolatedValue(t, half_data.positions)
    let vel2 = getInterpolatedValue(t, half_data.velocities)
    let oscillator2 = oscillator(pos2, vel2, V2(-3.5, 4.5), "lightblue", "blue")
    let osc2_diagram = oscillator2.diagram
    let osc2_line = line(oscillator2.block_pos, V2(0.02, pos2).apply(rul_transf)).stroke("blue").opacity(0.5).strokewidth(2)

    let pos3 = getInterpolatedValue(t, whole_data.positions)
    let out_of_bound = false
    if (Math.abs(pos3) > 3.7) {
        pos3= Math.sign(pos3) * 3.7
        out_of_bound = true
    }
    let vel3 = getInterpolatedValue(t, whole_data.velocities)
    let oscillator3 = oscillator(pos3, vel3, V2(-0.5, 4.5), "lightred", "red", out_of_bound)
    let osc3_diagram = oscillator3.diagram
    let osc3_line = line(oscillator3.block_pos, V2(0.02, pos3).apply(rul_transf)).stroke("red").opacity(out_of_bound ? 0.05 : 0.5).strokewidth(2)

    let oscillators = diagram_combine(osc1_line, osc2_line, osc3_line, osc1_diagram, osc2_diagram, osc3_diagram)

    let timeline = line(V2(t, -3).apply(transf), V2(t, 3).apply(transf)).strokedasharray([10]).stroke("gray")
    let circ1 = circle(0.05).stroke(0).fill("gray").position(V2(t, Math.cos(t)).apply(transf))
    let circ2 = square(0)
    if (Math.abs(pos3) < 3) {
        circ2 = circle(0.05).stroke(0).fill("red").position(V2(t, pos3).apply(transf))
    }
    let circ3 = circle(0.05).stroke(0).fill("blue").position(V2(t, pos2).apply(transf))

    draw(outline, statics, real_pos, half_pos, whole_pos, ...half_points, ...whole_points, oscillators, timeline, circ1, circ2, circ3)
}
int.slider("t", 0, Math.PI * 4, 0, 0.02, Math.PI * 4, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("ϵ", 1, 100, 20, 0.1, 10, (name, value) => name + " = " + (value / 100).toFixed(2) + " s")

int.draw()
int.draw()