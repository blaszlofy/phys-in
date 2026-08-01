//THE CODE MAY BE A BIT TOO SHORT, REFACTORED WITH AI SO IT'S NOT 500 LINES LONG

import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, line, xycorneraxes, mod, axes_transform, curve, plotf, circle, text, rectangle_corner, square, arrow1
} from "diagramatics"

let canvas = document.getElementById("canvas")
let control = document.getElementById("control")

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams))
}

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
    }

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

let outline = rectangle_corner(V2(-8, -6.5), V2(8, 4.5)).strokewidth(0)
let div1 = line(V2(-8, 1), V2(8, 1))
let div3 = line(V2(-8, -3), V2(8, -3))
let div2 = line(V2(3, 4.5), V2(3, 1))

let x_opt = {
    xrange: [0, 10],
    yrange: [0, 0.0001],
    yticks: [0],
    bbox: [V2(-6, 1.7), V2(1, 1.7)],
    headsize: 0
}
let x_line = xycorneraxes(x_opt).fontfamily("Math").fontsize(20).fill("black").stroke("black").textfill("black")
let A_bound = line(x_opt.bbox[0].add(V2(0, 1.5)), x_opt.bbox[0].add(V2(0, 2))).apply(mod.subdivide(40))
let B_bound = line(x_opt.bbox[1].add(V2(0, 1.5)), x_opt.bbox[1].add(V2(0, 2))).apply(mod.subdivide(40))
let transf_x = axes_transform(x_opt)
let x_bound = line(x_opt.bbox[0], x_opt.bbox[1]).apply(mod.subdivide(100))

let ax_opt = {
    xrange: x_opt.xrange,
    yrange: [7.5, 10],
    yticks: [8, 8.5, 9, 9.5],
    bbox: [V2(-7.5, -6), V2(7.5, -3.5)],
    headsize: 0.1
}
let transf_coord = axes_transform(ax_opt)
let ax = xycorneraxes(ax_opt).fontfamily("Math").fontsize(20).fill("black").stroke("black").textfill("black")

let x_leg = text("x (m)").fontfamily("Math").fontsize(20).position(V2(1.2, 1.9))
let x_leg2 = text("x (m)").fontfamily("Math").fontsize(20).position(V2(7.5, -6.25))
let t_leg = text("t (3.3 ⋅ 10⁻⁹ s)").fontfamily("Math").fontsize(20).position(V2(-7.1, -3.3))

let dash = line(V2(0, 0), V2(0.5, 0)).strokewidth(1.5).strokedasharray([10]).position(V2(3.4, 4))
let colored = line(V2(0, 0), V2(0.5, 0)).strokewidth(1.5).stroke("cyan").position(V2(3.4, 3.4))
let act = line(V2(0, 0), V2(0.5, 0)).strokewidth(8).stroke("lightgray").position(V2(3.4, 2.4))
let inact = line(V2(0, 0), V2(0.5, 0)).strokewidth(8).stroke("gray").position(V2(3.4, 1.9))
let dash_text = text("Path that takes the shortest time").fontfamily("Math").fontsize(20).position(V2(5.84, 4))
let col_text = text("Other paths colored based on").fontfamily("Math").fontsize(20).position(V2(5.7, 3.4))
let col_text2 = text("the time light takes to travel").fontfamily("Math").fontsize(20).position(V2(5.6, 3))
let act_text = text("Exposed mirror (reflects light)").fontfamily("Math").fontsize(20).position(V2(5.8, 2.4))
let inact_text = text("Covered mirror (blocks light)").fontfamily("Math").fontsize(20).position(V2(5.75, 1.9))

let stat = diagram_combine(div1, div2, div3, x_line, ax, x_leg, x_leg2, t_leg, dash, colored, dash_text, col_text, col_text2, act, inact, act_text, inact_text)

let int = new Interactive(control, canvas)

function create_vectors(A, B, n, m_left_idx, m_right_idx, user_idx) {
    let vecs = []
    let curr = V2(0, 0)
    let sum_x = 0
    let sum_y = 0
    let pdata = []

    for (let i = 0; i <= n; i++) {
        let P = V2((i / n) * 10, 0).apply(transf_x)
        let time = Math.hypot(P.x - A.x, P.y - A.y) + Math.hypot(P.x - B.x, P.y - B.y)
        let active = (i >= m_left_idx && i <= m_right_idx)


        sum_x += Math.cos(time * 30) * (30 / n)
        sum_y += Math.sin(time * 30) * (30 / n)

        pdata.push({ active: active, angle: time * 30, user: (i === user_idx) })
    }

    let offset = -Math.atan2(sum_y, sum_x)
    let a_start = null
    let a_end = null

    for (let i = 0; i <= n; i++) {
        let next = curr.add(V2(Math.cos(pdata[i].angle + offset), Math.sin(pdata[i].angle + offset)).scale(30 / n))

        if (pdata[i].active && !a_start) a_start = curr
        if (pdata[i].active) a_end = next

        let arr = arrow1(curr, next, 0.05).stroke(pdata[i].user ? "red" : (pdata[i].active ? "black" : "lightgray")).strokewidth(pdata[i].user ? 3 : 1).mut()
        if (!pdata[i].active) arr.opacity(0.25)

        vecs.push(arr)
        curr = next
    }

    if (a_start && a_end) {
        vecs.push(arrow1(a_start, a_end, 0.2).strokewidth(2).fill("black").stroke("black").mut())
    }

    return diagram_combine(...vecs)
}

int.draw_function = (inp) => {
    let A = inp["A"]
    let B = inp["B"]
    let n = Math.floor(inp["n"])

    let get_snap = (loc) => {
        let pct = Math.max(0, Math.min(1, (loc.x - x_opt.bbox[0].x) / (x_opt.bbox[1].x - x_opt.bbox[0].x)))
        let idx = Math.round(pct * n)
        return {
            idx: idx,
            data: (idx / n) * 10,
            bbox: x_opt.bbox[0].x + (idx / n) * (x_opt.bbox[1].x - x_opt.bbox[0].x)
        }
    }

    let s1 = get_snap(inp["M1"])
    let s2 = get_snap(inp["M2"])
    let sx = get_snap(inp["x"])

    let m_left_idx = Math.min(s1.idx, s2.idx)
    let m_right_idx = Math.max(s1.idx, s2.idx)
    let m_left_data = (m_left_idx / n) * 10
    let m_right_data = (m_right_idx / n) * 10

    let mirror_bg = rectangle_corner(V2(x_opt.bbox[0].x, x_opt.bbox[0].y), V2(x_opt.bbox[1].x, x_opt.bbox[0].y - 0.15)).fill("gray").strokewidth(0)
    let mirror_active = rectangle_corner(V2(Math.min(s1.bbox, s2.bbox), x_opt.bbox[0].y), V2(Math.max(s1.bbox, s2.bbox), x_opt.bbox[0].y - 0.15)).fill("lightgray").strokewidth(0)

    let paths = []
    let times = []

    for (let i = 0; i <= n; i++) {
        let P = V2((i / n) * 10, 0).apply(transf_x)
        let time = Math.hypot(P.x - A.x, P.y - A.y) + Math.hypot(P.x - B.x, P.y - B.y)

        times.push(time)
        paths.push({
            obj: curve([A, P, B]).mut().strokewidth((i >= m_left_idx && i <= m_right_idx) ? 0.4 : 0.2).opacity((i >= m_left_idx && i <= m_right_idx) ? 1 : 0.4),
            t: time
        })
    }

    let min_t = Math.min(...times)
    let max_t = Math.max(...times)

    paths.forEach(p => p.obj.stroke(min_t !== max_t ? colorLerp(min_t, max_t, p.t) : COLOR_START))
    let sorted_paths = paths.sort((a, b) => b.t - a.t).map(p => p.obj)

    let f = (x) => {
        let P = V2(x, 0).apply(transf_x)
        return Math.hypot(P.x - A.x, P.y - A.y) + Math.hypot(P.x - B.x, P.y - B.y)
    }

    let timeplot = []

    if (m_left_data > 0) {
        timeplot.push(plotf(f, {...ax_opt, xrange: [0, m_left_data], bbox: [V2(-7.5, -6), V2(-7.5 + m_left_data * 1.5, -3.5)]}).strokewidth(2).stroke("blue").opacity(0.15).mut())
    }
    if (m_right_data > m_left_data) {
        timeplot.push(plotf(f, {...ax_opt, xrange: [m_left_data, m_right_data], bbox: [V2(-7.5 + m_left_data * 1.5, -6), V2(-7.5 + m_right_data * 1.5, -3.5)]}).strokewidth(2).stroke("blue").mut())
    }
    if (10 > m_right_data) {
        timeplot.push(plotf(f, {...ax_opt, xrange: [m_right_data, 10], bbox: [V2(-7.5 + m_right_data * 1.5, -6), V2(7.5, -3.5)]}).strokewidth(2).stroke("blue").opacity(0.15).mut())
    }

    let P_user = V2(sx.data, 0).apply(transf_x)
    let user_t = Math.hypot(P_user.x - A.x, P_user.y - A.y) + Math.hypot(P_user.x - B.x, P_user.y - B.y)

    let ideal_x_bbox = findIdealX(A, B, 1, x_opt.bbox[0].y)
    let ideal_x_data = (ideal_x_bbox - x_opt.bbox[0].x) / (x_opt.bbox[1].x - x_opt.bbox[0].x) * 10
    let ideal_t = Math.hypot(ideal_x_bbox - A.x, x_opt.bbox[0].y - A.y) + Math.hypot(B.x - ideal_x_bbox, x_opt.bbox[0].y - B.y)

    draw(
        outline, mirror_bg, mirror_active, stat,
        create_vectors(A, B, n, m_left_idx, m_right_idx, sx.idx).position(V2(-2.7, -1)),
        ...sorted_paths, ...timeplot,

        line(V2(sx.data, ax_opt.yrange[0]).apply(transf_coord), V2(sx.data, ax_opt.yrange[1]).apply(transf_coord)).strokedasharray([10]).stroke("gray"),
        circle(0.05).position(V2(sx.data, user_t).apply(transf_coord)).strokewidth(0).fill("blue"),
        text("A").fontfamily("Math").fontsize(20).position(A.add(V2(-0.4, 0))),
        text("B").fontfamily("Math").fontsize(20).position(B.add(V2(0.4, 0))),

        curve([A, V2(ideal_x_bbox, x_opt.bbox[0].y), B]).strokewidth(1.5).stroke("black").strokedasharray([10]),
        line(V2(ideal_x_data, ax_opt.yrange[0]).apply(transf_coord), V2(ideal_x_data, ax_opt.yrange[1]).apply(transf_coord)).strokedasharray([10]).stroke("red"),
        circle(0.05).position(V2(ideal_x_data, ideal_t).apply(transf_coord)).strokewidth(0).fill("red"),
        text("C").fontfamily("Math").fontsize(20).position(V2(ideal_x_data, ideal_t).apply(transf_coord).add(V2(0.2, 0.3))),
        curve([A, P_user, B]).strokewidth(1).stroke("gray").strokedasharray([10])
    )
}

int.slider("n", 45, 100, 50, 1, 10, (name, value) => name + " = " + value.toFixed(0))

int.locator("A", V2(-5, 3.7), 0.2, "red", A_bound)
int.locator("B", V2(0, 3.7), 0.2, "blue", B_bound)
int.locator("x", V2(-5, 0), 0.2, "lightblue", x_bound)
int.locator("M1", x_opt.bbox[0], 0.2, "cyan", x_bound)
int.locator("M2", x_opt.bbox[1], 0.2, "cyan", x_bound)

int.draw()
int.draw()