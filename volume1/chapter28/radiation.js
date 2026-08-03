import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, line, xyaxes, circle, axes_transform, arrow1, plotf, square, image, text,
    distribute_horizontal_and_align
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
const k = 30
let amount = 60
const dist = 9

let ax1_opt = {
    xrange: [0, 60],
    yrange: [-3, 3],
    bbox: [V2(-7.5, -4.4), V2(7.8, -1.1)],
    headsize: 0.1
}
let transf1 = axes_transform(ax1_opt)
let ax2_opt = {
    xrange: [0, 60],
    yrange: [-3, 3],
    bbox: [V2(-7.5, -0.9), V2(7.8, 2.4)],
    headsize: 0.1
}
let transf2 = axes_transform(ax2_opt)

let outline = rectangle(16, 9).strokewidth(0);
let div1 = line(V2(-8, -1), V2(8 , -1))
let div2 = line(V2(-8, 2.5), V2(8 , 2.5))

let ax1 = xyaxes(ax1_opt).stroke("black").fill("black").fontfamily("Math").fontsize(20).textfill("black")
let ax2 = xyaxes(ax2_opt).stroke("black").fill("black").fontfamily("Math").fontsize(20).textfill("black")

let t1 = text("*").fontsize(30).fontfamily("Math").position(V2(7.6, 2.1)).fontweight("bold")
let t2 = text("**").fontsize(30).fontfamily("Math").position(V2(7.6, -1.4)).fontweight("bold")

let ch = circle(0.15).strokewidth(0).fill("lightred").position(V2(-5.5, 4))
let ch_t = text("Positive electric charge").fontsize(20).fontfamily("Math").position(V2(-3.9, 4))
let evec = arrow1(V2(0, 0), V2(0.5, 0), 0.05).fill("red").stroke("red").strokewidth(2).position(V2(-5.725, 3.1))
let evec_t = text("Value of the electric field at a point").fontsize(20).fontfamily("Math").position(V2(-3.05, 3.1))
let pl = line(V2(0, 0), V2(0.5, 0)).strokewidth(2).stroke("lightblue").position(V2(0.5, 3.45))
let pl_t = text("Illustrative plot, proportional to 1/x").fontsize(20).fontfamily("Math").position(V2(3.4, 3.45))

let x = text("x (m)").fontsize(20).fontfamily("Math").position(V2(7.5, 0.45))

let stat = diagram_combine(div1, div2, ax1, ax2, t1, t2, ch, ch_t, evec, evec_t, pl, pl_t, x, x.position(V2(7.5, -3.05)))

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let A = inp["A"]
    let w = inp["ω"]
    let t = inp["t"]

    let y = (time) => A * Math.sin(w * time)
    let v_y = (time) => A * w * Math.cos(w * time)
    let a_y = (time) => - A * w**2 * Math.sin(w * time)

    let charge1 = circle(0.15).strokewidth(0).fill("lightred").position(V2(0, y(t)).apply(transf1))
    let charge2 = circle(0.15).strokewidth(0).fill("lightred").position(V2(0, y(t)).apply(transf2))

    let E1 = []
    for (let i = 1; i <= amount; i++) {
        let step = (ax1_opt.xrange[1] - (ax1_opt.xrange[0])) / amount
        let r = i * step + dist
        if (r > ax1_opt.xrange[1]) continue
        let E = -(k / (c**2 * r)) * a_y(t - r / c)
        E1.push(arrow1(V2(r, 0).apply(transf1), V2(r, E).apply(transf1), 0.05).fill("red").stroke("red").strokewidth(2))
    }

    //FEYNMAN PROVIDES THE HEAVISIDE-FEYNMAN FORMULA, BUT FOR NOT WANTING TO DO NUMERICAL DERIVATIVES, HERE THE LIÉNARD-WIECHERT FORMULA IS USED
    let E2 = []
    for (let i = 1; i <= amount; i++) {
        let step = (ax1_opt.xrange[1] - (ax1_opt.xrange[0])) / amount
        let r = V2(i * step, 0)

        if (r.x < 1) continue

        //ALL VARIABLES FOR LIÉNARD WIECHERT
        let tr = get_retarded_time(r.x, 0, t, y, c)
        let rr = V2(0, y(tr))
        let R = r.sub(rr)
        let n = R.normalize()
        R = R.length()
        let beta = V2(0, v_y(tr)).scale(1 / c)
        let beta_dot = V2(0, a_y(tr)).scale(1 / c)
        let gamma = 1 / Math.sqrt(1 - beta.length_sq())

        //ACTUAL LIÉNARD WIECHERT IN ONE LINE
        let E = (n.sub(beta).scale(1 / (gamma**2 * (1 - beta.dot(n))**3 * R**2)).add((n.sub(beta)).scale(n.dot(beta_dot)).sub(beta_dot.scale(n.dot(n.sub(beta)))).scale(1 / (c * (1 - beta.dot(n))**3 * R)))).scale(k)

        let out_of_bound = Math.abs(E.y) > ax2_opt.yrange[1]

        if (out_of_bound) {
            E = E.normalize().scale(Math.sign(E.y) * ax2_opt.yrange[1] / Math.sin(E.angle()))
            E2.push(arrow1(r.apply(transf2), r.add(E).apply(transf2), 0).fill("red").stroke("red").strokewidth(2))
            continue
        }

        E2.push(arrow1(r.apply(transf2), r.add(E).apply(transf2), 0.05).fill("red").stroke("red").strokewidth(2))
    }

    let p1 = plotf(x => k * A * w**2/(x * c**2), {...ax1_opt, xrange: [dist, 60], bbox: [V2(V2(dist, 0).apply(transf1).x, -4.4), V2(7.8, -1.1)]}).stroke("lightblue").strokewidth(2)
    let p12 = plotf(x => k * A * w**2/(x * c**2), {...ax1_opt, xrange: [0, dist], bbox: [V2(-7.5, -4.4), V2(V2(dist, 0).apply(transf1).x, -1.1)]}).stroke("lightblue").strokewidth(2).strokedasharray([10])
    let p2 = plotf(x => k * A * w**2/(x * c**2), ax2_opt).stroke("lightblue").strokewidth(2)

    let dotdot = distribute_horizontal_and_align([
        circle(0.03).strokewidth(0).fill("lightred"),
        circle(0.03).strokewidth(0).fill("lightred"),
        circle(0.03).strokewidth(0).fill("lightred"),
        circle(0.03).strokewidth(0).fill("lightred"),
    ], 0.3, "center").position(V2(-6.8, -2.6))

    draw(outline, stat, charge1, charge2, ...E1, ...E2, p1, p12, p2, dotdot)
}

int.slider("t", 0, 10, 0, 0.04, 10, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("A", 1, 1.5, 1, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " m")
int.slider("ω", 3, 6, 5, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " rad/s")

int.draw()
int.draw()