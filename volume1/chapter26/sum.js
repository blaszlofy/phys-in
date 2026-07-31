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
let A_bound = line(x_opt.bbox[0].add(V2(0, 1.5)), x_opt.bbox[0].add(V2(0, 2.5))).apply(mod.subdivide(40))
let B_bound = line(x_opt.bbox[1].add(V2(0, 1.5)), x_opt.bbox[1].add(V2(0, 2.5))).apply(mod.subdivide(40))
let transf_x = axes_transform(x_opt)
let x_bound = line(x_opt.bbox[0], x_opt.bbox[1]).apply(mod.subdivide(40))

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

let dash = line(V2(0, 0), V2(0.5, 0)).strokewidth(1.5).strokedasharray([10]).position(V2(3.4, 3))
let colored = line(V2(0, 0), V2(0.5, 0)).strokewidth(1.5).stroke("cyan").position(V2(3.4, 2))
let dash_text = text("Path that takes the shortest time").fontfamily("Math").fontsize(20).position(V2(5.8, 3))
let col_text = text("Other paths colored based on").fontfamily("Math").fontsize(20).position(V2(5.7, 2))
let col_text2 = text("the time light takes to travel").fontfamily("Math").fontsize(20).position(V2(5.6, 1.6))

let stat = diagram_combine(div1, div2, div3, x_line, ax, x_leg, x_leg2, t_leg, dash, colored, dash_text, col_text, col_text2)

let int = new Interactive(control, canvas)

function create_vectors(A, B, num_paths, m_left, m_right, x_user_index) {
    let vecs = []
    let curr = V2(0, 0)
    let scale_angle = 30
    let scale_len = 30 / num_paths

    let sum_x = 0
    let sum_y = 0
    let path_data = []

    for (let i = 0; i <= num_paths; i++) {
        let x_data = (i / num_paths) * x_opt.xrange[1]
        let P = V2(x_data, 0).apply(transf_x)
        let is_active = (P.x >= m_left && P.x <= m_right)

        let dist1 = Math.hypot(P.x - A.x, P.y - A.y)
        let dist2 = Math.hypot(P.x - B.x, P.y - B.y)
        let total_time = dist1 + dist2
        let angle = total_time * scale_angle

        sum_x += Math.cos(angle) * scale_len
        sum_y += Math.sin(angle) * scale_len


        path_data.push({ is_active: is_active, angle: angle, is_user: (i === x_user_index) })
    }

    let resultant_angle = Math.atan2(sum_y, sum_x)
    let offset_angle = -resultant_angle

    let active_start = null
    let active_end = null

    for (let i = 0; i <= num_paths; i++) {
        let pd = path_data[i]
        let final_angle = pd.angle + offset_angle
        let next = curr.add(V2(Math.cos(final_angle), Math.sin(final_angle)).scale(scale_len))

        if (pd.is_active && active_start === null) {
            active_start = curr
        }
        if (pd.is_active) {
            active_end = next
        }

        let col = pd.is_user ? "red" : (pd.is_active ? "black" : "lightgray")
        let w = pd.is_user ? 3 : 1

        let arr = arrow1(curr, next, 0.05).stroke(col).strokewidth(w).mut()
        if (!pd.is_active) {
            arr.opacity(0.15)
        }

        vecs.push(arr)
        curr = next
    }

    if (active_start && active_end) {
        vecs.push(arrow1(active_start, active_end, 0.2).strokewidth(2).fill("black").stroke("black").mut())
    }

    return diagram_combine(...vecs)
}

let num_cache = -1
int.draw_function = (inp) => {
    let A = inp["A"]
    let B = inp["B"]
    let num_paths = Math.floor(inp["n"])
    let x_user = inp["x"].sub(x_opt.bbox[0]).scale((x_opt.xrange[1] - x_opt.xrange[0]) / (x_opt.bbox[1].x - x_opt.bbox[0].x)).x

    let m_left = Math.min(inp["M1"].x, inp["M2"].x)
    let m_right = Math.max(inp["M1"].x, inp["M2"].x)

    if (num_cache !== num_paths) {
        let new_x_bound = line(x_opt.bbox[0], x_opt.bbox[1]).apply(mod.subdivide(num_paths))
        let cur_x = inp["x"]
        let cur_m1 = inp["M1"]
        let cur_m2 = inp["M2"]
        int.remove_locator("x")
        int.remove_locator("M1")
        int.remove_locator("M2")
        int.locator("x", cur_x, 0.2, "lightblue", new_x_bound)
        int.locator("M1", cur_m1, 0.2, "cyan", new_x_bound)
        int.locator("M2", cur_m2, 0.2, "cyan", new_x_bound)

        num_cache = num_paths
    }

    let mirror_y = x_opt.bbox[0].y
    let mirror_bg = rectangle_corner(V2(x_opt.bbox[0].x, mirror_y), V2(x_opt.bbox[1].x, mirror_y - 0.15)).fill("#555555").strokewidth(0)
    let mirror_active = rectangle_corner(V2(m_left, mirror_y), V2(m_right, mirror_y - 0.15)).fill("#bbbbbb").strokewidth(0)

    let data = []
    let paths = []
    let x_user_index = 0
    let min_user_dist = Infinity

    for (let i = 0; i <= num_paths; i++) {
        let x_data = (i / num_paths) * x_opt.xrange[1]
        let P = V2(x_data, 0).apply(transf_x)

        let d_user = Math.hypot(P.x - inp["x"].x, P.y - inp["x"].y)
        if (d_user < min_user_dist) {
            min_user_dist = d_user
            x_user_index = i
        }

        let dist1 = Math.hypot(P.x - A.x, P.y - A.y)
        let dist2 = Math.hypot(P.x - B.x, P.y - B.y)

        let total_time = dist1 + dist2
        data.push(total_time)

        let is_active = (P.x >= m_left && P.x <= m_right)

        let path = curve([A, P, B]).mut().strokewidth(is_active ? 0.4 : 0.2)
        paths.push({obj: path, d: total_time, active: is_active})
    }

    let max_dist = Math.max(...data)
    let min_dist = Math.min(...data)

    for (let i = 0; i < paths.length; i++) {
        let col = COLOR_START
        if (max_dist !== min_dist) {
            col = colorLerp(min_dist, max_dist, paths[i].d)
        }
        paths[i].obj.stroke(col)

        if (!paths[i].active) {
            paths[i].obj.opacity(0.4)
        }
    }

    paths.sort((a, b) => b.d - a.d)
    let sortedPathObjects = paths.map(p => p.obj)

    let timeplot = []

    let data_w = x_opt.xrange[1] - x_opt.xrange[0]
    let bbox_w = x_opt.bbox[1].x - x_opt.bbox[0].x
    let m_left_data = (m_left - x_opt.bbox[0].x) * (data_w / bbox_w) + x_opt.xrange[0]
    let m_right_data = (m_right - x_opt.bbox[0].x) * (data_w / bbox_w) + x_opt.xrange[0]

    let f = (x) => {
        let P = V2(x, 0).apply(transf_x)
        let dist1 = Math.hypot(P.x - A.x, P.y - A.y)
        let dist2 = Math.hypot(P.x - B.x, P.y - B.y)
        return dist1 + dist2
    }

    let make_ax = (x0, x1) => {
        let pct0 = (x0 - ax_opt.xrange[0]) / data_w
        let pct1 = (x1 - ax_opt.xrange[0]) / data_w
        let bx0 = ax_opt.bbox[0].x + pct0 * bbox_w
        let bx1 = ax_opt.bbox[0].x + pct1 * bbox_w
        return {
            xrange: [x0, x1],
            yrange: ax_opt.yrange,
            bbox: [V2(bx0, ax_opt.bbox[0].y), V2(bx1, ax_opt.bbox[1].y)],
            headsize: ax_opt.headsize
        }
    }

    if (m_left_data > x_opt.xrange[0]) {
        timeplot.push(plotf(f, make_ax(x_opt.xrange[0], m_left_data)).strokewidth(2).stroke("blue").opacity(0.15).mut())
    }
    if (m_right_data > m_left_data) {
        timeplot.push(plotf(f, make_ax(m_left_data, m_right_data)).strokewidth(2).stroke("blue").mut())
    }
    if (x_opt.xrange[1] > m_right_data) {
        timeplot.push(plotf(f, make_ax(m_right_data, x_opt.xrange[1])).strokewidth(2).stroke("blue").opacity(0.15).mut())
    }

    let user_line = line(V2(x_user, ax_opt.yrange[0]).apply(transf_coord), V2(x_user, ax_opt.yrange[1]).apply(transf_coord)).strokedasharray([10]).stroke("gray")
    let P_user = V2(x_user, 0).apply(transf_x)
    let dist1_user = Math.hypot(P_user.x - A.x, P_user.y - A.y)
    let dist2_user = Math.hypot(P_user.x - B.x, P_user.y - B.y)
    let user_point = circle(0.05).position(V2(x_user, dist1_user + dist2_user).apply(transf_coord)).strokewidth(0).fill("blue")

    let A_leg = text("A").fontfamily("Math").fontsize(20).position(A.add(V2(-0.4, 0)))
    let B_leg = text("B").fontfamily("Math").fontsize(20).position(B.add(V2(0.4, 0)))

    let boundaryY = x_opt.bbox[0].y
    let ideal_X = findIdealX(A, B, 1, boundaryY)
    let ideal_P = V2(ideal_X, boundaryY)
    let ideal_path = curve([A, ideal_P, B]).strokewidth(1.5).stroke("black").strokedasharray([10])

    let user_path = curve([A, inp["x"], B]).strokewidth(1).stroke("gray").strokedasharray([10])

    ideal_X = V2(ideal_X, 0).sub(x_opt.bbox[0]).scale((x_opt.xrange[1] - x_opt.xrange[0]) / (x_opt.bbox[1].x - x_opt.bbox[0].x)).x
    let min_line = line(V2(ideal_X, ax_opt.yrange[0]).apply(transf_coord), V2(ideal_X, ax_opt.yrange[1]).apply(transf_coord)).strokedasharray([10]).stroke("red")
    let _P = V2(ideal_X, 0).apply(transf_x)
    let _dist1 = Math.hypot(_P.x - A.x, _P.y - A.y)
    let _dist2 = Math.hypot(_P.x - B.x, _P.y - B.y)
    let min_point = circle(0.05).position(V2(ideal_X, _dist1 + _dist2).apply(transf_coord)).strokewidth(0).fill("red")
    let c = text("C").fontfamily("Math").fontsize(20).position(min_point.get_anchor("center-center").add(V2(0.2, 0.3)))

    let phasors = create_vectors(A, B, num_paths, m_left, m_right, x_user_index).position(V2(-4, -1))

    draw(outline, mirror_bg, mirror_active, stat, phasors, ...sortedPathObjects, ...timeplot, user_line, user_point, A_leg, B_leg, ideal_path, min_line, min_point, c, user_path)
}

int.slider("n", 35, 100, 40, 1, 10, (name, value) => name + " = " + value.toFixed(0))

int.locator("A", V2(-5, 3.7), 0.2, "red", A_bound)
int.locator("B", V2(0, 3.7), 0.2, "blue", B_bound)
int.locator("x", V2(-5, 0), 0.2, "lightblue", x_bound)
int.locator("M1", x_opt.bbox[0], 0.2, "cyan", x_bound)
int.locator("M2", x_opt.bbox[1], 0.2, "cyan", x_bound)

int.draw()
int.draw()