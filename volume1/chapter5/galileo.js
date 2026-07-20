import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, line, V2, polygon, to_radian, circle, boolean, square, numberline, xycorneraxes, TAG, text, plotf,
    curve, axes_transform
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

const SCALE = 1/6;
const C = 0.07;
let l = 0;

let ruler_opt = {
    xrange: [0, 30],
    yrange: [0, 0.001],
    yticks: [],
    xticks: [10, 20, 30, 40, 50, 60, 70],
    headsize: 0,
    ticksize: 0.5,
}

let axes_opt = {
    xrange: [0, 5],
    yrange: [0, 65],
    bbox: [V2(0, 0), V2(5.5, 8)],
    xticks: [1, 2, 3, 4, 5],
    yticks: [10, 20, 30, 40, 50, 60],
    n_sample: 100,
    headsize: 0.1,
    ticksize: 0.1
}

//STATIC
let outline = rectangle(16, 9).strokewidth(0);
let divider = line(V2(1, -4.5), V2(1, 4.5))

let axes = xycorneraxes(axes_opt).position(V2(2, -4)).stroke("black").textfill("black").fontfamily("Math").fontsize(20)
    .apply_to_tagged_recursive(TAG.GRAPH_TICK_LABEL, d => d.translate(V2(-0.03, -0.02))).fill("black")
let time_label = text("t (s)").fontfamily("Math").fontsize(20).position(V2(7.5, -4.2))
let dist_label = text("D (m)").fontfamily("Math").fontsize(20).position(V2(1.5, 4.3))

let int = new Interactive(control, canvas);

let ruler, back_plot;
let intervals = [square(0)];

let g_cache = -1;
let theta_cache = -1;
let m_cache = -1;

function get_x(t, theta, g) {
    return (1/2) * (g * Math.sin(theta)) / 1.4 * Math.pow(t, 2)
}

int.draw_function = (inp) => {
    let t = inp["t"]
    let g = inp["g"]
    let theta = to_radian(inp["θ"])
    let m = inp["m"]

    let x = get_x(t, theta, g)
    let r = Math.cbrt(m)
    l = (12.5/1.4) * g * Math.sin(theta)
    let ball_angle = (x * SCALE)/(r * C)

    let top = V2(-7.5, -4 + (SCALE * l * Math.sin(theta)))
    let ramp = polygon([V2(-7.5, -4), V2(-7.5 + (SCALE * l * Math.cos(theta)), -4), top])
        .strokewidth(1).fill("lightblue").opacity(0.7)
    let dir = V2(1, 0).rotate(-theta).normalize()
    let offset = V2(0, r * C).rotate(-theta)
    let outside = circle(r * C).fill("lightblue").strokewidth(0)
    let inside = boolean.difference(circle(r * C), diagram_combine(square(r * C).translate(V2(r * C * 0.5, r * C * 0.5)), square(r * C).translate(V2(-r * C * 0.5, -r * C * 0.5))))
        .strokewidth(0).fill("#9cbeef")
    let ball = diagram_combine(outside, inside).rotate(-ball_angle).position(top.add(offset).add(dir.scale(x * SCALE)))

    let transf = axes_transform(axes_opt)

    let real_plot = square(0);
    if (t > 0) {
        let plot_points = [];
        let n_points = Math.max(10, Math.floor(t * 10));
        for(let i = 0; i <= n_points; i++) {
            let current_t = (i / n_points) * t;
            let current_x = get_x(current_t, theta, g);
            plot_points.push(V2(current_t, current_x).apply(transf));
        }
        real_plot = curve(plot_points).position(V2(2, -4)).stroke("blue").strokewidth(2);
    }

    let t_line = curve([V2(t, 0).apply(transf), V2(t, x).apply(transf), V2(0, x).apply(transf)])
        .strokedasharray([10]).stroke("darkgray").position(V2(2, -4))
    let pos = circle(0.05).fill("blue").strokewidth(0).position(V2(t, x).apply(transf).add(V2(2, -4)))

    if (g_cache !== g || theta_cache !== theta || m_cache !== m) {
        for (let i = 0; i <= 4; i++) {
            let x_i = get_x(i, theta, g)
            intervals[i] = diagram_combine(
                curve([V2(i, 0).apply(transf), V2(i, x_i).apply(transf), V2(0, x_i).apply(transf)])
                    .strokedasharray([10]).stroke("darkgray").position(V2(2, -4)),
                circle(0.05).fill("blue").strokewidth(0).position(V2(i, x_i).apply(transf).add(V2(2, -4))),
                circle(C * r).position(top.add(offset).add(dir.scale(x_i * SCALE))).strokewidth(0).fill("lightblue").opacity(0.5)
            )
        }

        back_plot = plotf((num => get_x(num, theta, g)), axes_opt).position(V2(2, -4))
            .strokedasharray([10]).stroke("lightblue")
        ruler = xycorneraxes({...ruler_opt, xrange: [0, l - 3]}).position(top).rotate(-theta).scale(SCALE)
            .apply_to_tagged_recursive(TAG.GRAPH_TICK_LABEL, d => d.translate(V2(-0.2, 0))).stroke("black").fontfamily("Math").fontsize(20).textfill("black")

        g_cache = g;
        theta_cache = theta;
        m_cache = m;
    }

    let drawn_intervals = []
    for (let i = 0; i < 5; i++) {
        if (i < t) {
            drawn_intervals[i] = intervals[i]
        }
    }
    draw(outline, divider, ramp, ruler, axes, back_plot, real_plot, t_line, pos, ...drawn_intervals, ball, time_label, dist_label)
}

function timeFormat(name, value) {
    return (name + " = " + value.toFixed(2) + " s");
}

function accFormat(name, value) {
    return (name + " = " + value.toFixed(2) + " m/s²");
}

function angleFormat(name, value) {
    return (name + " = " + value.toFixed(2) + "°");
}

function massFormat(name, value) {
    return (name + " = " + value.toFixed(2) + " kg");
}

int.slider("t", 0, 5, 0, 0.01, 5, timeFormat)
int.slider("g", 5, 10, 9.81, 0.01, 10, accFormat)
int.slider("θ", 30, 45, 30, 1, 10, angleFormat)
int.slider("m", 10, 100, 50, 1, 10, massFormat)

int.draw()
int.draw()