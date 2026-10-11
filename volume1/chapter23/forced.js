import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, line, V2, linspace, curve, square, arrow1, xyaxes, plotf, text, axes_transform, xycorneraxes,
    ytickmark, circle,
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

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

const sus_point = V2(-7.8, 3.35)

let outline = rectangle(16, 9).strokewidth(0);

let div1 = line(V2(-8, 2.2), V2(8, 2.2))
let div2 = line(V2(-8, -0.5), V2(8, -0.5))
let div3 = line(V2(0, -0.5), V2(0, -4.5))

let wall = line(V2(-7.8, 2.5), V2(-7.8, 4.2)).strokewidth(3).stroke("lightgray")
let equilibrium = line(V2(0, 2.3), V2(0, 4.4)).strokewidth(2).stroke("lightgray").strokedasharray([10])

let x_opt = {
    xrange: [0, 20],
    yrange: [-7.2, 7.2],
    bbox: [V2(-7.6, -0.4), V2(6, 2.1)],
    yticks: [-6, -2, 2, 6],
    n_sample: 400,
    headsize: 0.1
}
let theta_opt = {
    xrange: [0, 11],
    yrange: [-4, 1],
    bbox: [V2(-7.4, -4.2), V2(-0.9, -1)],
    yticks: [],
    n_sample: 150,
    headsize: 0.1
}
let rho_opt = {
    xrange: [0, 11],
    yrange: [0, 20],
    bbox: [V2(0.6, -4.2), V2(7.1, -1)],
    yticks: [5, 10, 15],
    n_sample: 150,
    headsize: 0.1
}
let x_ax = xyaxes(x_opt).fill("black").stroke("black").fontfamily("Math").fontsize(20).textfill("black")
let theta_ax = xycorneraxes(theta_opt).fill("black").stroke("black").fontfamily("Math").fontsize(20).textfill("black")
let rho_ax = xycorneraxes(rho_opt).fill("black").stroke("black").fontfamily("Math").fontsize(20).textfill("black")

let x_transf = axes_transform(x_opt)
let theta_transf = axes_transform(theta_opt)
let rho_transf = axes_transform(rho_opt)

let F_leg = line(V2(0, -0.6), V2(0.5,  -0.6)).stroke("red").strokewidth(1.5)
let F_text = text("F(t)").fontsize(20).fontfamily("Math").position(V2(0.8, -0.6))
let x_leg = line(V2(0, 0), V2(0.5,  0)).stroke("blue").strokewidth(1.5)
let x_text = text("x(t)").fontsize(20).fontfamily("Math").position(V2(0.8, 0))
let tick_0 = ytickmark(0, 0, "0°", theta_opt).fontsize(20).fontfamily("Math").textfill("black")
let tick_1 = ytickmark(-Math.PI / 2, 0, "-90°", theta_opt).fontsize(20).fontfamily("Math").textfill("black")
let tick_2 = ytickmark(-Math.PI, 0, "-180°", theta_opt).fontsize(20).fontfamily("Math").textfill("black")

let F0_text = text("F₀cos(ωt)").fontsize(20).fontfamily("Math").position(V2(7, 4.2))
let F0_arrow = arrow1(V2(0, 0), V2(0.5, 0), 0.1).stroke("lightred").fill("lightred").strokewidth(2).position(V2(5.7, 4.2))

let theta_text = text("θ (°)").fontfamily("Math").fontsize(20).position(V2(-7.6, -0.8))
let w_text1 = text("ω (rad/s)").fontfamily("Math").fontsize(20).position(V2(-0.65, -4))
let w_text2 = text("ω (rad/s)").fontfamily("Math").fontsize(20).position(V2(7.45, -4))
let rho_text = text("ρ (m)").fontfamily("Math").fontsize(20).position(V2(0.6, -0.8))

let leg = diagram_combine(F_leg, F_text, x_leg, x_text).position(V2(6.8, 1.9))

let t_text = text("t (s)").fontsize(20).fontfamily("Math").position(V2(6.4, 0.87))

let stat = diagram_combine(div1, F0_text, F0_arrow, wall, equilibrium, div2, div3, x_ax, leg, t_text, theta_ax, rho_ax, tick_0, tick_1, tick_2, theta_text, rho_text, w_text1, w_text2)

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let t = inp["t"]
    let F0 = inp["F₀"]
    let w0 = inp["ω₀"]
    let w = inp["ω"]
    let gamma = inp["γ"] / 100

    let theta = (w) => Math.atan2(-gamma * w, w0**2 - w**2)
    let rho = (w) => F0 / Math.sqrt((w0**2 - w**2)**2 + (gamma * w)**2)
    let x = (t) => rho(w) * Math.cos(w * t + theta(w))
    let F = (t) => F0 * Math.cos(w * t)

    let mass_pos = V2(x(t), sus_point.y)
    if (Math.abs(mass_pos.x) > 7.2) {
        mass_pos.x = Math.sign(mass_pos.x) * 7.2
    }

    let mass = square(0.6).strokewidth(0).fill("lightblue").position(mass_pos).mut()
    let sp = spring(sus_point, mass_pos, 0.2, 20, 0.13, 300).mut()
    let force = arrow1(mass_pos, mass_pos.add(V2(F(t), 0)), 0.1).stroke("lightred").fill("lightred").strokewidth(2).mut()
    if (Math.abs(mass_pos.x + F(t)) > 8) {
        force = line(mass_pos, V2(Math.sign(mass_pos.x + F(t)) * 8, mass_pos.y)).stroke("lightred").strokewidth(2).mut()
    }
    if (Math.abs(x(t)) >= 7.2) {
        sp.fill("#e1e1e1").stroke("#e1e1e1")
        force.fill("#e1e1e1").stroke("#e1e1e1")
        mass.fill("#e1e1e1").stroke("#e1e1e1")
    }

    let x_plot = plotf((t) => x(t), x_opt).stroke("blue").strokewidth(1.5)
    let f_plot = plotf((t) => F(t), x_opt).stroke("red").strokewidth(1.5)
    let zero_line = line(V2(0, 0).apply(theta_transf), V2(11, 0).apply(theta_transf)).stroke("gray").strokedasharray([10])
    let pi_line = line(V2(0, -Math.PI).apply(theta_transf), V2(11, -Math.PI).apply(theta_transf)).stroke("gray").strokedasharray([10])
    let pi2_line = line(V2(0, -Math.PI / 2).apply(theta_transf), V2(11, -Math.PI / 2).apply(theta_transf)).stroke("gray").strokedasharray([10])
    let w0_line = line(V2(w0, -4).apply(theta_transf), V2(w0, 1).apply(theta_transf)).stroke("gray").strokedasharray([10])

    let w_circ = circle(0.05).strokewidth(0).fill("blue").position(V2(w, theta(w)).apply(theta_transf))
    let w_line = line(V2(w, -4).apply(theta_transf), V2(w, 1).apply(theta_transf)).stroke("black").strokedasharray([10])

    let w0_line2 = line(V2(w0, 0).apply(rho_transf), V2(w0, 20).apply(rho_transf)).stroke("gray").strokedasharray([10])
    let w_circ2 = circle(0.05).strokewidth(0).fill("blue").position(V2(w, rho(w)).apply(rho_transf))
    let w_line2 = line(V2(w, 0).apply(rho_transf), V2(w, 20).apply(rho_transf)).stroke("black").strokedasharray([10])

    let plot_lines = diagram_combine(zero_line, pi_line, pi2_line, w0_line, w_line, w0_line2, w_line2)

    let rho_plot = plotf(w => rho(w), rho_opt).stroke("lightblue").strokewidth(2)
    let theta_plot = plotf(w => theta(w), theta_opt).stroke("lightblue").strokewidth(2)

    let timeline = line(V2(t, -7.2).apply(x_transf), V2(t, 7.2).apply(x_transf)).stroke("gray").strokedasharray([10])
    let pos_circ = circle(0.05).strokewidth(0).fill("blue").position(V2(t, x(t)).apply(x_transf))
    let f_circ = circle(0.05).strokewidth(0).fill("red").position(V2(t, F(t)).apply(x_transf))

    draw(outline, sp, stat, force, mass, timeline, f_plot, plot_lines, x_plot, rho_plot, theta_plot, w_circ, (rho(w) < 20) ? w_circ2 : square(0), (Math.abs(x(t)) < 7.2) ? pos_circ : square(0), (Math.abs(F(t)) < 7.2) ? f_circ : square(0))
}

int.slider("t", 0, 20, 0, 0.02, 20, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("F₀", 3, 10, 5, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " N")
int.slider("ω", 1, 10, 4, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " rad/s")
int.slider("ω₀", 2, 10, 3, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " rad/s")
int.slider("γ", 10, 40, 25, 1, 10, (name, value) => name + " = " + (value / 100).toFixed(2) + " s⁻¹")

int.draw()
int.draw()