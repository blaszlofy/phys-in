import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, line, xyaxes, circle, axes_transform, arrow1
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

function get_retarded_time(x, y, t, pos, c) {
    let tr = t - Math.sqrt(x*x + y*y) / c

    for(let i = 0; i < 10; i++) {
        let charge_y = pos(tr)
        let dist = Math.sqrt(x*x + Math.pow(y - charge_y, 2))
        tr = t - dist / c
    }

    return tr
}

const c = 10
const k = 200
const amount = 50
const dist = 8

let ax1_opt = {
    xrange: [0, 20],
    yrange: [-3, 3],
    bbox: [V2(-7.5, -4.4), V2(7.8, -1.1)],
    headsize: 0.1
}
let transf1 = axes_transform(ax1_opt)
let ax2_opt = {
    xrange: [0, 20],
    yrange: [-3, 3],
    bbox: [V2(-7.5, -0.9), V2(7.8, 2.4)],
    headsize: 0.1
}
let transf2 = axes_transform(ax2_opt)

let outline = rectangle(16, 9);
let div1 = line(V2(-8, -1), V2(8 , -1))
let div2 = line(V2(-8, 2.5), V2(8 , 2.5))

let ax1 = xyaxes(ax1_opt).stroke("black").fill("black").fontfamily("Math").fontsize(20).textfill("black")
let ax2 = xyaxes(ax2_opt).stroke("black").fill("black").fontfamily("Math").fontsize(20).textfill("black")

let stat = diagram_combine(div1, div2, ax1, ax2)

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let A = inp["A"]
    let w = inp["ω"]
    let t = inp["t"]

    let y = (time) => A * Math.sin(w * time)
    let a_y = (time) => - A * w**2 * Math.sin(w * time)

    let charge1 = circle(0.15).strokewidth(0).fill("lightblue").position(V2(0, y(t)).apply(transf1))
    let charge2 = circle(0.15).strokewidth(0).fill("lightblue").position(V2(0, y(t)).apply(transf2))

    let E1 = []
    for (let i = 1; i <= amount; i++) {
        let step = (ax1_opt.xrange[1] - (ax1_opt.xrange[0])) / amount
        let r = i * step + dist
        if (r > ax1_opt.xrange[1]) continue
        let E = -(k / (c**2 * r)) * a_y(t - r / c)
        E1.push(arrow1(V2(r, 0).apply(transf1), V2(r, E).apply(transf1), 0.1).fill("red").stroke("red"))
    }

    let E2 = []
    for (let i = 1; i <= amount; i++) {
        let step = (ax1_opt.xrange[1] - (ax1_opt.xrange[0])) / amount
        let r = i * step
        let tr = get_retarded_time(r, 0, t, y, c)
        let E = -(k / (c**2 * r)) * a_y(t - r / c)
        //E2.push(arrow1(V2(r, 0).apply(transf2), V2(r, E).apply(transf2), 0.1).fill("red").stroke("red"))
    }

    draw(outline, stat, charge1, charge2, ...E1, ...E2)
}

int.slider("t", 0, 10, 0, 0.02, 10, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("A", 1, 1.5, 1, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " m")
int.slider("ω", 2, 5, 3, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " rad/s")

int.draw()
int.draw()