import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    line,
    V2,
    xycorneraxes,
    plotf,
    Interactive,
    circle,
    arc,
    plotv,
    axes_transform,
    square,
    arrow1, text, distribute_horizontal_and_align, distribute_vertical_and_align, align_vertical
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

//STATIC
let sus_point = V2(-2.5, 4.3)

let outline = rectangle(16, 9).strokewidth(0)

let divider1 = line(V2(-8, -1.5), V2(8, -1.5))
let divider2 = line(V2(3, -1.5), V2(3, 4.5))
let divider3 = line(V2(3, 2.5), V2(8, 2.5))

let pot_square = square(0.3).fill("blue").strokewidth(0)
let kin_square = square(0.3).fill("red").strokewidth(0)
let pot_text = text("P.E. - potential energy").fontfamily("Math").fontsize(20)
let kin_text = text("K.E. - kinetic energy").fontfamily("Math").fontsize(20)

let legend = distribute_vertical_and_align(
    [distribute_horizontal_and_align([pot_square, pot_text], 1.4, "center"),
        distribute_horizontal_and_align([kin_square, kin_text], 1.3, "center")],
    0.1, "left").position(V2(4, 3.8)
)

let setup = diagram_combine(outline, divider1, divider2, divider3)

let suspension = line(V2(sus_point.x - 1.5, sus_point.y), V2(sus_point.x + 1.5, sus_point.y)).strokewidth(3).stroke("lightgray")

let axes_opt = {
    xrange: [0, 17],
    yrange: [0, 6.5],
    yticks: [1, 3, 5],
    bbox: [V2(-7.7, -4.2), V2(7.7, -1.8)],
    headsize: 0.1,
    n_sample: 200
}
let axes = xycorneraxes(axes_opt).stroke("black").fill("black").fontfamily("Math").fontsize(20).textfill("black")
let time = text("t (s)").fontfamily("Math").fontsize(20).position(V2(7.4, -4.45))
let energy = text("E").fontfamily("Math").fontsize(20).position(V2(-8,  -2))

let int = new Interactive(control, canvas);

let period = 4
let omega = Math.sqrt(9.81/4)
let max_energy = 1.569
const theta_0 = 0.2

let g_cache = -1;
let l_cache = -1;
let m_cache = -1;
let pot_energy_plot, kin_energy_plot, total_energy_plot;

int.draw_function = (inp) => {
    let t = inp["t"];
    let g = inp["g"];
    let l = inp["l"];
    let m = inp["m"];

    //PENDULUM
    omega = Math.sqrt(g/l);
    period = 2 * Math.PI / omega;
    let theta = theta_0 * Math.cos(omega * t);
    let pend_pos = V2(sus_point.x + l * Math.sin(theta), sus_point.y - l * Math.cos(theta));

    let path = arc(l, 0.6).position(sus_point).rotate(-Math.PI/2 - 0.3).strokedasharray([10]);
    let rope = line(sus_point, pend_pos);
    let ball = circle(0.15 * Math.cbrt(m)).position(pend_pos).fill("lightblue").strokewidth(0)

    let end_point = sus_point.sub(pend_pos).normalize().rotate(Math.PI / 2).scale(omega * theta_0 * l * Math.sin(omega * t))
    let vel_vector = arrow1(pend_pos, pend_pos.add(end_point), 0.1).fill("lightred").stroke("lightred").strokewidth(2)

    //ENERGY PLOT
    if (g !== g_cache || l !== l_cache || m !== m_cache) {
        max_energy = 1/2 * m * g * l * Math.pow(theta_0, 2);
        pot_energy_plot = plotf((x) => max_energy * Math.pow(Math.cos(omega * x), 2), axes_opt).stroke("blue").strokewidth(2)
        kin_energy_plot = plotf((x) => max_energy * Math.pow(Math.sin(omega * x), 2), axes_opt).stroke("red").strokewidth(2)
        total_energy_plot = plotf((x) => max_energy, {...axes_opt, n_sample: 2}).stroke("lightblue").strokewidth(2)

        g_cache = g; l_cache = l; m_cache = m;
    }

    let time_line = plotv([V2(t, 0.0), V2(t, 6.5)], axes_opt).stroke("lightgray").strokewidth(2).strokedasharray([10]);
    let pot_plot_point = circle(0.07).position(V2(t, max_energy * Math.pow(Math.cos(omega * t), 2)).apply(axes_transform(axes_opt))).strokewidth(0).fill("blue");
    let kin_plot_point = circle(0.07).position(V2(t, max_energy * Math.pow(Math.sin(omega * t), 2)).apply(axes_transform(axes_opt))).strokewidth(0).fill("red");
    let total_plot_point = circle(0.07).position(V2(t, max_energy).apply(axes_transform(axes_opt))).strokewidth(0).fill("lightblue");
    let timeline = diagram_combine(time_line, pot_plot_point, kin_plot_point, total_plot_point);

    //ENERGY BAR
    let pot_energy_bar = rectangle(3, 1).position(V2(5.5, 0)).strokewidth(0).fill("blue")
    let kin_energy_bar = rectangle(3 * Math.pow(Math.sin(omega * t), 2), 1).position(V2(4 + Math.pow(Math.sin(omega * t), 2) * 1.5, 0)).strokewidth(0).fill("red")
    let bar_outline = rectangle(3, 1).position(V2(5.5, 0)).strokewidth(0)
    let bar = diagram_combine(pot_energy_bar, kin_energy_bar, bar_outline)

    //ENERGY VALUES
    let kin_text = text((max_energy * Math.pow(Math.sin(omega * t), 2)).toFixed(2).toString()).fontfamily("Math").fontsize(20)
    let pot_text = text((max_energy * Math.pow(Math.cos(omega * t), 2)).toFixed(2).toString()).fontfamily("Math").fontsize(20)
    let total_text = text(max_energy.toFixed(2).toString()).fontfamily("Math").fontsize(20).translate(V2(2.65, 0))
    let plus = text("+").fontfamily("Math").fontsize(20).translate(V2(0.4, 0)).translate(V2(0.5, 0))
    let equal = text("=").fontfamily("Math").fontsize(20).translate(V2(2.2,0))
    let pot_square2 = square(0.3).fill("blue").strokewidth(0)
    let kin_square2 = square(0.3).fill("red").strokewidth(0)
    let energy_values = align_vertical([
        distribute_horizontal_and_align([kin_square2, kin_text], 0.35, "center"),
        plus,
        distribute_horizontal_and_align([pot_square2, pot_text], 0.35, "center").translate(V2(1.25, 0)),
        equal, total_text], "center"
    ).position(V2(4.15, 1.5))

    draw(setup, pot_energy_plot, kin_energy_plot, total_energy_plot, axes, time, energy, timeline, path, vel_vector, rope, ball, suspension, bar, legend, energy_values);
}

function timeFormat(name, value) {
    return (name + " = " + value.toFixed(2) + " s");
}

function accFormat(name, value) {
    return (name + " = " + value.toFixed(2) + " m/s²");
}

function distFormat(name, value) {
    return (name + " = " + value.toFixed(2) + " m");
}

function massFormat(name, value) {
    return (name + " = " + value.toFixed(2) + " kg");
}

int.slider("t", 0, period * 4, 0, 0.01, period * 4, timeFormat);
int.slider("g", 5, 12, 9.81, 0.1, 10, accFormat);
int.slider("l", 1, 5, 4, 0.1, 10, distFormat);
int.slider("m", 1, 5, 2, 0.1, 10, massFormat);

int.draw()
int.draw()