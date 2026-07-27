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
const l = 4
const m = 0.5
const dist = 4

//STATIC
let outline = rectangle(16, 9).strokewidth(0);
let divider1 = line(V2(-8, -1.5), V2(8, -1.5))
let divider2 = line(V2(-8, 1.5), V2(8, 1.5))
let divider3 = line(V2(1, 4.5), V2(1, 1.5))
let tit1 = text("Observer riding in a car at velocity v₂").fontfamily("Math").fontsize(20).position(V2(0, -1.8))
let tit2 = text("Observer standing still on the ground (Lab Frame)").fontfamily("Math").fontsize(20).position(V2(0, 1.2))

let stroked = line(V2(0, 0), V2(0.5, 0)).strokedasharray([10]).strokewidth(2).position(V2(1.5, 3.5))
let basic = line(V2(0, 0), V2(0.5, 0)).stroke("black").strokewidth(2).position(V2(1.5, 2.5))
let stroked_text = text("momentum of m₁ or m₂ or total momentum").fontfamily("Math").fontsize(20).position(V2(4.7, 3.5))
let basic_text = text("velocity of m₁ or m₂ or both").fontfamily("Math").fontsize(20).position(V2(3.8, 2.5))
let leg = diagram_combine(stroked, basic, stroked_text, basic_text)

let stat = diagram_combine(divider1, divider2, divider3, tit1, tit2)

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let m1 = inp["m1"]
    let m2 = inp["m2"]
    let v1 = inp["v1"]
    let v2 = inp["v2"]
    let t = inp["t"]

    let t_collision = dist / (v1 - v2)
    let x_collision = -dist / 2 + v1 * t_collision
    let v_final = (m1 * v1 + m2 * v2) / (m1 + m2)

    let base = polygon([V2(-l, 1), V2(-l, 0), V2(l, 0), V2(l, 1), V2(l + dx, 1), V2(l + dx, -dx), V2(-l - dx, -dx), V2(-l - dx, 1)]).fill("lightgray").strokewidth(0)
    let mass1 = rectangle(m1 * m, 0.4).strokewidth(0).fill("lightred").move_origin("bottom-right").position(V2(-dist / 2, 0)).mut()
    let mass2 = rectangle(m2 * m, 0.4).strokewidth(0).fill("lightblue").move_origin("bottom-left").position(V2(dist / 2, 0)).mut()

    let wall = false

    if (t <= t_collision) {
        mass1.position(V2(-dist / 2 + v1 * t, 0))
        mass2.position(V2(dist / 2 + v2 * t, 0))
    } else {
        let x = x_collision + v_final * (t - t_collision)
        if ((x + m2 * m) > l) {
            x = l - m2 * m
            wall = true
        } else if ((x - m1 * m) < -l) {
            x = -l + m1 * m
            wall = true
        }
        let pos = V2(x, 0)
        mass1.position(pos)
        mass2.position(pos)
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
    } else if (!wall && v_final !== 0) {
        let s = mass1.get_anchor("top-right").add(V2(0, 0.15))
        vel_diagram.push(arrow1(s, s.add(V2(v_final * 0.4, 0)), 0.1).stroke("grey").fill("grey"))
        vel_diagram.push(text(((v_final === 1) ? "" : ((v_final === -1) ? "-" : v_final.toPrecision(2))).toString() + "v").position(s.add(V2(v_final * 0.4 / 2, 0.2))).fontsize(20).fontfamily("Math"))
    }

    let sys1 = diagram_combine(system, ...vel_diagram).position(V2(0, -0.5))

    let vel_diagram2 = []
    if (t <= t_collision) {
        let s1 = mass1.get_anchor("top-center").add(V2(0, 0.15))
        vel_diagram2.push(arrow1(s1, s1.add(V2((v1 - v2) * 0.4, 0)), 0.1).stroke("red").fill("red"))
        vel_diagram2.push(text((((v1 - v2) === 1) ? "" : (v1 - v2)).toString() + "v").position(s1.add(V2((v1 - v2) * 0.4 / 2, 0.2))).fontsize(20).fontfamily("Math"))
    } else if (!wall && v_final !== 0) {
        let s = mass1.get_anchor("top-right").add(V2(0, 0.15))
        vel_diagram2.push(arrow1(s, s.add(V2((v_final - v2) * 0.4, 0)), 0.1).stroke("grey").fill("grey"))
        vel_diagram2.push(text((((v_final - v2) === 1) ? "" : (v_final - v2).toPrecision(2)).toString() + "v").position(s.add(V2((v_final - v2) * 0.4 / 2, 0.2))).fontsize(20).fontfamily("Math"))}

    let pos = Math.min(-3.9 - v2 * t, 3.9)

    let s = system.get_anchor("bottom-center").add(V2(0, -0.15))
    if (pos < 3.9) {
        vel_diagram2.push(arrow1(s, s.add(V2(-v2 * 0.4, 0)), 0.1).fill("black").strokewidth(2).apply_to_tagged_recursive(TAG.ARROW_LINE, d => d.strokedasharray([10])))
        vel_diagram2.push(text(((v2 === -1) ? "" : -v2).toString() + "v").position(s.add(V2(-v2 * 0.4 / 2, -0.2))).fontsize(20).fontfamily("Math"))
    }
    let sys2 = diagram_combine(system, ...vel_diagram2).position(V2(pos, -3.5))

    let p = m1 * v1 + m2 * v2
    let p1 = (t < t_collision) ?  (m1 * v1) : (m1 * v_final)
    let p2 = (t < t_collision) ? (m2 * v2) : (m2 * v_final)

    if (wall) {
        p1 = 0
        p2 = 0
        p = 0
    }

    let p1_arrow = arrow1(V2(0, 0), V2(p1 * 0.5, 0), 0.1).fill("red").stroke("red").strokedasharray([10]).strokewidth(2)
    let p1_tx = text("p₁ = " + ((p1 === 1) ? "mv" : ((p1 === 0) ? "0" : ((p1 === -1) ? "-mv" : (p1.toPrecision(2) + "mv"))))).position(p1_arrow.get_anchor("center-center").add(V2(0, 0.2))).fontsize(20).fontfamily("Math")
    let p2_arrow = arrow1(V2(0, -1), V2(p2  * 0.5, -1), 0.1).fill("blue").stroke("blue").strokedasharray([10]).strokewidth(2)
    let p2_tx = text("p₂ = " + ((p2 === 1) ? "mv" : ((p2 === 0) ? "0" : ((p2 === -1) ? "-mv" : (p2.toPrecision(2) + "mv"))))).position(p2_arrow.get_anchor("center-center").add(V2(0, 0.2))).fontsize(20).fontfamily("Math")
    let p_arrow = arrow1(V2(0, -2), V2(p  * 0.5, -2), 0.1).fill("gray").stroke("gray").strokedasharray([10]).strokewidth(2)
    let p_tx = text("p = " + ((p === 1) ? "mv" : ((p === 0) ? "0" : ((p === -1) ? "-mv" : (p.toPrecision(2) + "mv"))))).position(p_arrow.get_anchor("center-center").add(V2(0, 0.2))).fontsize(20).fontfamily("Math")
    let plus = text("+").fontfamily("Math").fontsize(25).position(V2(0, -0.4))
    let equal = text("=").fontfamily("Math").fontsize(25).position(V2(0, -1.4))
    let momentum = diagram_combine(p1_tx, p1_arrow, p2_tx, p2_arrow, p_tx, p_arrow, plus, equal).move_origin("center-center").position(V2(-3.5, 3))

    draw(outline, stat, leg, sys1, sys2, momentum)
}
int.slider("t", 0, 6, 0, 0.02, 6, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("m1", 1, 3, 1, 1, 10, (name, value) => "m₁ = " + ((value === 1) ? "" : value.toFixed(0)) + "m")
int.slider("m2", 1, 3, 1, 1, 10, (name, value) => "m₂ = " + ((value === 1) ? "" : value.toFixed(0)) + "m")
int.slider("v1", 0, 3, 0, 1, 10, (name, value) => "v₁ = " + ((value === 1) ? "" : value.toFixed(0)) + ((value === 0) ? "" : "v") )
int.slider("v2", -3, -1, -1, 1, 10, (name, value) => "v₂ = " + ((value === -1) ? "-" : value.toFixed(0)) + "v" )

int.draw()
int.draw()