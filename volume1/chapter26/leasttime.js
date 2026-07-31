import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, line, xycorneraxes, mod, axes_transform, curve, plotf, circle, text, rectangle_corner
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

const detail = 200

function findIdealX(A, B, n, boundaryY) {
    let left = Math.min(A.x, B.x)
    let right = Math.max(A.x, B.x)
    let mid = (left + right) / 2

    const derivative = (X) => {
        let d1 = Math.hypot(X - A.x, boundaryY - A.y)
        let d2 = Math.hypot(B.x - X, boundaryY - B.y)
        let sin1 = (X - A.x) / d1
        let sin2 = (B.x - X) / d2
        return sin1 - n * sin2
    };

    for (let i = 0; i < 25; i++) {
        mid = (left + right) / 2
        if (derivative(mid) > 0) {
            right = mid
        } else {
            left = mid
        }
    }
    return mid
}

const COLOR_START = "#aec7e8"
const COLOR_END = "#17becf"

const _intC1 = parseInt(COLOR_START.substring(1), 16)
const _intC2 = parseInt(COLOR_END.substring(1), 16)

const _r1 = _intC1 >> 16
const _g1 = (_intC1 >> 8) & 255
const _b1 = _intC1 & 255

const _r2 = _intC2 >> 16
const _g2 = (_intC2 >> 8) & 255
const _b2 = _intC2 & 255

function colorLerp(min, max, value) {
    const t = (value - min) / (max - min)

    const r = _r1 + t * (_r2 - _r1)
    const g = _g1 + t * (_g2 - _g1)
    const b = _b1 + t * (_b2 - _b1)

    return '#' + (1 << 24 | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

let outline = rectangle(16, 9).strokewidth(0)
let div1 = line(V2(-8, -1), V2(8, -1))
let div2 = line(V2(3, 4.5), V2(3, -1))

let x_opt = {
    xrange: [0, 10],
    yrange: [0, 0.0001],
    yticks: [0],
    bbox: [V2(-6, 1.7), V2(1, 1.7)],
    headsize: 0
}
let x_line = xycorneraxes(x_opt).fontfamily("Math").fontsize(20).fill("black").stroke("black").textfill("black")
let A_bound = line(x_opt.bbox[0].add(V2(0, 1.5)), x_opt.bbox[0].add(V2(0, 2.5))).apply(mod.subdivide(40))
let transf_x = axes_transform(x_opt)
let x_bound = line(x_opt.bbox[0], x_opt.bbox[1]).apply(mod.subdivide(100))

let ax_opt = {
    xrange: x_opt.xrange,
    yrange: [0, 15],
    yticks: [0, 5, 10, 15],
    bbox: [V2(-7.5, -4), V2(7.5, -1.5)],
    headsize: 0.1
}
let transf_coord = axes_transform(ax_opt)
let ax = xycorneraxes(ax_opt).fontfamily("Math").fontsize(20).fill("black").stroke("black").textfill("black")

let value_to_x = (value) => {
    return V2(value, 0).apply(transf_x).x
}

let mat = text("Material where light").fontfamily("Math").fontsize(20).position(V2(-6, 0))
let mat2 = text("travels n times").fontfamily("Math").fontsize(20).position(V2(-6, -0.4))
let mat3 = text("slower than in air").fontfamily("Math").fontsize(20).position(V2(-6, -0.8))
let air = text("Air").fontfamily("Math").fontsize(20).position(V2(2, 4))
let x_leg = text("x (m)").fontfamily("Math").fontsize(20).position(V2(1.2, 1.9))
let x_leg2 = text("x (m)").fontfamily("Math").fontsize(20).position(V2(7.5, -4.25))
let t_leg = text("t (3.3 ⋅ 10⁻⁹ s)").fontfamily("Math").fontsize(20).position(V2(-7.1, -1.3))

let dash = line(V2(0, 0), V2(0.5, 0)).strokewidth(1.5).strokedasharray([10]).position(V2(3.4, 3))
let colored = line(V2(0, 0), V2(0.5, 0)).strokewidth(1.5).stroke("cyan").position(V2(3.4, 2))
let dash_text = text("Path that takes the shortest time").fontfamily("Math").fontsize(20).position(V2(5.8, 3))
let col_text = text("Other paths colored based on").fontfamily("Math").fontsize(20).position(V2(5.7, 2))
let col_text2 = text("the time light takes to travel").fontfamily("Math").fontsize(20).position(V2(5.6, 1.6))

let stat = diagram_combine(div1, div2, x_line, ax, mat, mat2, mat3, air, x_leg, x_leg2, t_leg, dash, colored, dash_text, col_text, col_text2)

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let A = inp["A"]
    let B = inp["B"]
    let n = inp["n"]
    let x_user = inp["x"].sub(x_opt.bbox[0]).scale((x_opt.xrange[1] - x_opt.xrange[0]) / (x_opt.bbox[1].x - x_opt.bbox[0].x)).x

    let data = []
    let paths = []

    for (let i = 0; i <= detail; i++) {
        let x_data = (i / detail) * x_opt.xrange[1]
        let P = V2(x_data, 0).apply(transf_x)

        let dist1 = Math.hypot(P.x - A.x, P.y - A.y)
        let dist2 = n * Math.hypot(P.x - B.x, P.y - B.y)

        let total_time = dist1 + dist2
        data.push(total_time)

        let path = curve([A, P, B]).mut().strokewidth(0.2)

        paths.push({obj: path, d: total_time})
    }

    let max_dist = Math.max(...data)
    let min_dist = Math.min(...data)

    for (let i = 0; i < paths.length; i++) {
        if (max_dist === min_dist) {
            paths[i].obj.stroke(COLOR_START)
        } else {
            paths[i].obj.stroke(colorLerp(min_dist, max_dist, paths[i].d))
        }
    }

    paths.sort((a, b) => b.d - a.d)
    let sortedPathObjects = paths.map(p => p.obj)

    let pl = plotf((x) => {
        let P = V2(x, 0).apply(transf_x)
        let dist1 = Math.hypot(P.x - A.x, P.y - A.y)
        let dist2 = n * Math.hypot(P.x - B.x, P.y - B.y)
        return (dist1 + dist2)
    }, ax_opt).strokewidth(2).stroke("blue")

    let user_line = line(V2(x_user, 0).apply(transf_coord), V2(x_user, ax_opt.yrange[1]).apply(transf_coord)).strokedasharray([10]).stroke("gray")
    let P = V2(x_user, 0).apply(transf_x)
    let dist1 = Math.hypot(P.x - A.x, P.y - A.y)
    let dist2 = n * Math.hypot(P.x - B.x, P.y - B.y)
    let user_point = circle(0.05).position(V2(x_user, dist1 + dist2).apply(transf_coord)).strokewidth(0).fill("blue")

    let material = rectangle_corner(V2(-8, -1), V2(3, 1.7)).strokewidth(0).fill("lightblue").opacity((n - 1) * 0.7)

    let A_leg = text("A").fontfamily("Math").fontsize(20).position(A.add(V2(-0.4, 0)))
    let B_leg = text("B").fontfamily("Math").fontsize(20).position(B.add(V2(0.4, 0)))

    let boundaryY = x_opt.bbox[0].y
    let ideal_X = findIdealX(A, B, n, boundaryY)
    let ideal_P = V2(ideal_X, boundaryY)
    let ideal_path = curve([A, ideal_P, B]).strokewidth(1.5).stroke("black").strokedasharray([10])

    let user_path = curve([A, inp["x"], B]).strokewidth(1).stroke("gray").strokedasharray([10])

    ideal_X = V2(ideal_X, 0).sub(x_opt.bbox[0]).scale((x_opt.xrange[1] - x_opt.xrange[0]) / (x_opt.bbox[1].x - x_opt.bbox[0].x)).x
    let min_line = line(V2(ideal_X, 0).apply(transf_coord), V2(ideal_X, ax_opt.yrange[1]).apply(transf_coord)).strokedasharray([10]).stroke("red")
    let _P = V2(ideal_X, 0).apply(transf_x)
    let _dist1 = Math.hypot(_P.x - A.x, _P.y - A.y)
    let _dist2 = n * Math.hypot(_P.x - B.x, _P.y - B.y)
    let min_point = circle(0.05).position(V2(ideal_X, _dist1 + _dist2).apply(transf_coord)).strokewidth(0).fill("red")
    let c = text("C").fontfamily("Math").fontsize(20).position(min_point.get_anchor("center-center").add(V2(0.2, -0.3)))

    draw(outline, material, stat, ...sortedPathObjects, pl, user_line, user_point, A_leg, B_leg, ideal_path, min_line, min_point, c, user_path)
}

int.slider("n", 1, 1.5, 1.33, 0.01, 10, (name, value) => name + " = " + value.toFixed(2))

int.locator("A", V2(-5, 3.7), 0.2, "red", null, true, null, {type: "rect", max: x_opt.bbox[0].add(V2(2, 2.5)), min: x_opt.bbox[0].add(V2(0, 1))})
int.locator("B", V2(0, 0), 0.2, "blue", null,  true, null, {type: "rect", max: x_opt.bbox[1].add(V2(0, -1.5)), min: x_opt.bbox[1].add(V2(-2, -2.5))})
int.locator("x", V2(-5, 0), 0.2, "lightblue", x_bound)

int.draw()
int.draw()