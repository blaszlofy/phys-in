import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, curve, V2, polygon, text, arrow1, square, boolean, TAG, line
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

const dx = 0.1
const l = 7
const m = 0.5
const dist = 6

//STATIC
let outline = rectangle(16, 9).strokewidth(0);
let divider1 = line(V2(-8, -1.5), V2(8, -1.5))
let divider2 = line(V2(-8, 1.5), V2(8, 1.5))
let divider3 = line(V2(1, 4.5), V2(1, 1.5))

let stroked = line(V2(0, 0), V2(0.5, 0)).strokedasharray([10]).strokewidth(2).position(V2(1.5, 4))
let basic = line(V2(0, 0), V2(0.5, 0)).stroke("black").strokewidth(2).position(V2(1.5, 3))
let stroked_text = text("momentum of m₁ or m₂ or total momentum").fontfamily("Math").fontsize(20).position(V2(4.7, 4))
let basic_text = text("velocity of m₁ or m₂ or both").fontfamily("Math").fontsize(20).position(V2(3.8, 3))
let sq = square(0.25).strokewidth(0).fill("black").position(V2(1.75, 2))
let sq_text = text("kinetic energy of m₁ or m₂ or total kinetic energy").fontfamily("Math").fontsize(20).position(V2(5, 2))
let leg = diagram_combine(stroked, basic, stroked_text, basic_text, sq, sq_text)

let stat = diagram_combine(divider1, divider2, divider3)

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let m1 = inp["m1"]
    let m2 = inp["m2"]
    let v1 = inp["v1"]
    let v2 = inp["v2"]
    let t = inp["t"]

    let t_collision = dist / (v1 - v2)
    let x_collision = -dist / 2 + v1 * t_collision
    let m_tot = m1 + m2
    let v_final1 = (m1 - m2) / m_tot * v1 + 2 * m2 / m_tot * v2
    let v_final2 = 2 * m1 / m_tot * v1 + (m2 - m1) / m_tot * v2

    let base = polygon([V2(-l, 1), V2(-l, 0), V2(l, 0), V2(l, 1), V2(l + dx, 1), V2(l + dx, -dx), V2(-l - dx, -dx), V2(-l - dx, 1)]).fill("lightgray").strokewidth(0)
    let mass1 = rectangle(m1 * m, 0.4).strokewidth(0).fill("lightred").move_origin("bottom-right").position(V2(-dist / 2, 0)).mut()
    let mass2 = rectangle(m2 * m, 0.4).strokewidth(0).fill("lightblue").move_origin("bottom-left").position(V2(dist / 2, 0)).mut()

    let wall1 = false
    let wall2 = false

    if (t <= t_collision) {
        mass1.position(V2(-dist / 2 + v1 * t, 0))
        mass2.position(V2(dist / 2 + v2 * t, 0))
    } else {
        let x1 = x_collision + v_final1 * (t - t_collision)
        let x2 = x_collision + v_final2 * (t - t_collision)
        if ((x1 - m1 * m) < -l) {
            wall1 = true
            x1 = -l + m1 * m
        }
        if ((x2 + m2 * m) > l) {
            wall2 = true
            x2 = l - m2 * m
        }
        if (x1 > x2 && wall1) {
            x2 = x1
            wall2 = true
        } else if (x2 < x1 && wall2) {
            x1 = x2
            wall1 = true
        }
        mass1.position(V2(x1, 0))
        mass2.position(V2(x2, 0))
    }
    let mass1_text = text(((m1 === 1) ? "" : m1.toFixed(0)) + "m").fontfamily("Math").fontsize(20).position(mass1.get_anchor("center-center"))
    let mass2_text = text(((m2 === 1) ? "" : m2.toFixed(0)) + "m").fontfamily("Math").fontsize(20).position(mass2.get_anchor("center-center"))

    let system = diagram_combine(base, mass1, mass2, mass1_text, mass2_text)

    let vel_diagram = []

    if (t <= t_collision) {
        let s1 = mass1.get_anchor("top-center").add(V2(0, 0.15))
        let s2 = mass2.get_anchor("top-center").add(V2(0, 0.15))
        if (v1 !== 0) {
            vel_diagram.push(arrow1(s1, s1.add(V2(v1 * 0.4, 0)), 0.1).stroke("red").fill("red"))
            vel_diagram.push(text(((v1 === 1) ? "" : v1).toString() + "v").position(s1.add(V2(v1 * 0.4 / 2, 0.2))).fontsize(20).fontfamily("Math"))
        }
        vel_diagram.push(arrow1(s2, s2.add(V2(v2 * 0.4, 0)), 0.1).stroke("blue").fill("blue"))
        vel_diagram.push(text(((v2 === -1) ? "-" : v2).toString() + "v").position(s2.add(V2(v2 * 0.4 / 2, 0.2))).fontsize(20).fontfamily("Math"))
    } else {
        if (!wall1) {
            let s1 = mass1.get_anchor("top-center").add(V2(0, 0.15))
            if (v_final1 !== 0) {
                vel_diagram.push(arrow1(s1, s1.add(V2(v_final1 * 0.4, 0)), 0.1).stroke("red").fill("red"))
                vel_diagram.push(text(((v_final1 === 1) ? "" : ((v_final1 === -1) ? "-" : v_final1.toPrecision(2))) + "v").position(s1.add(V2(v_final1 * 0.4 / 2, 0.2))).fontsize(20).fontfamily("Math"))
            }
        }
        if (!wall2) {
            let s2 = mass2.get_anchor("top-center").add(V2(0, 0.15))
            if (v_final2 !== 0) {
                vel_diagram.push(arrow1(s2, s2.add(V2(v_final2 * 0.4, 0)), 0.1).stroke("blue").fill("blue"))
                vel_diagram.push(text(((v_final2 === 1) ? "" : ((v_final2 === -1) ? "-" : v_final2.toPrecision(2))) + "v").position(s2.add(V2(v_final2 * 0.4 / 2, 0.2))).fontsize(20).fontfamily("Math"))
            }
        }
    }

    let sys1 = diagram_combine(system, ...vel_diagram).position(V2(0, -3.3))

    let p1 = (t < t_collision) ?  (m1 * v1) : (m1 * v_final1)
    let p2 = (t < t_collision) ? (m2 * v2) : (m2 * v_final2)
    if (wall1) {
        p1 = 0
    }
    if (wall2) {
        p2 = 0
    }
    let p = p1 + p2

    let p1_arrow = arrow1(V2(0, 0), V2(p1 * 0.5, 0), 0.1).fill("red").stroke("red").strokedasharray([10]).strokewidth(2)
    let p1_tx = text("p₁ = " + ((p1 === 1) ? "mv" : ((p1 === 0) ? "0" : ((p1 === -1) ? "-mv" : (p1.toPrecision(2) + "mv"))))).position(p1_arrow.get_anchor("center-center").add(V2(0, 0.2))).fontsize(20).fontfamily("Math")
    let p2_arrow = arrow1(V2(0, -1), V2(p2  * 0.5, -1), 0.1).fill("blue").stroke("blue").strokedasharray([10]).strokewidth(2)
    let p2_tx = text("p₂ = " + ((p2 === 1) ? "mv" : ((p2 === 0) ? "0" : ((p2 === -1) ? "-mv" : (p2.toPrecision(2) + "mv"))))).position(p2_arrow.get_anchor("center-center").add(V2(0, 0.2))).fontsize(20).fontfamily("Math")
    let p_arrow = arrow1(V2(0, -2), V2(p  * 0.5, -2), 0.1).fill("gray").stroke("gray").strokedasharray([10]).strokewidth(2)
    let p_tx = text("p = " + ((p === 1) ? "mv" : ((p === 0) ? "0" : ((p === -1) ? "-mv" : (p.toPrecision(2) + "mv"))))).position(p_arrow.get_anchor("center-center").add(V2(0, 0.2))).fontsize(20).fontfamily("Math")
    let plus = text("+").fontfamily("Math").fontsize(25).position(V2(0, -0.4))
    let equal = text("=").fontfamily("Math").fontsize(25).position(V2(0, -1.4))
    let momentum = diagram_combine(p1_tx, p1_arrow, p2_tx, p2_arrow, p_tx, p_arrow, plus, equal).move_origin("center-center").position(V2(-3.5, 3))

    let e1 = (t < t_collision) ? m1 * v1**2 * (1 / 2) : m1 * v_final1**2 * (1 / 2)
    let e2 = (t < t_collision) ? m2 * v2**2 * (1 / 2) : m2 * v_final2**2 * (1 / 2)
    if (wall1) {
        e1 = 0
    }
    if (wall2) {
        e2 = 0
    }
    let e = e1 + e2
    let tot = rectangle(e * 0.5, 0.5)
    let rect1 = rectangle(e1 * 0.5, 0.5).move_origin("center-left").position(tot.get_anchor("center-left")).strokewidth(0).fill("red")
    let rect2 = rectangle(e2 * 0.5, 0.5).move_origin("center-right").position(tot.get_anchor("center-right")).strokewidth(0).fill("blue")
    let energy = (e > 0) ? diagram_combine(tot, rect1, rect2).position(V2(0, -0.5)) : square(0)

    let sq1 = square(0.25).strokewidth(0).fill("red")
    let sq2 = square(0.25).strokewidth(0).fill("blue").position(V2(1.7, 0))
    let t1 = text(e1.toFixed(2) + "mv²").fontfamily("Math").fontsize(20).position(V2(0.8, 0))
    let t2 = text(e2.toFixed(2) + "mv²").fontfamily("Math").fontsize(20).position(V2(2.5, 0))
    let plus2 = text("+").fontfamily("Math").fontsize(20).position(V2(1.4, 0))
    let equal2 = text("=").fontfamily("Math").fontsize(20).position(V2(3.2, 0))
    let tt = text(e.toFixed(2) + "mv²").fontfamily("Math").fontsize(20).position(V2(3.9, 0))
    let energy_leg = diagram_combine(sq1, t1, plus2, sq2, t2, equal2, tt).move_origin("bottom-center").position(V2(0, 0.3))

    draw(outline, stat, leg, sys1, momentum, energy, energy_leg)
}
int.slider("t", 0, 10, 0, 0.02, 10, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("m1", 1, 3, 1, 1, 10, (name, value) => "m₁ = " + ((value === 1) ? "" : value.toFixed(0)) + "m")
int.slider("m2", 1, 3, 1, 1, 10, (name, value) => "m₂ = " + ((value === 1) ? "" : value.toFixed(0)) + "m")
int.slider("v1", 0, 3, 0, 1, 10, (name, value) => "v₁ = " + ((value === 1) ? "" : value.toFixed(0)) + ((value === 0) ? "" : "v") )
int.slider("v2", -3, -1, -1, 1, 10, (name, value) => "v₂ = " + ((value === -1) ? "-" : value.toFixed(0)) + "v" )

int.draw()
int.draw()