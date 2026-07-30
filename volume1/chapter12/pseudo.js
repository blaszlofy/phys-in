import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, curve, V2, polygon, text, arrow1, square, boolean, TAG, line, annotation
} from "diagramatics";

let canvas = document.getElementById("canvas");
let canvas2 = document.getElementById("canvas2");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};
let draw2 = (...diagrams) => {
    draw_to_svg(canvas2, diagram_combine(...diagrams));
};

const dx = 0.1
const l = 2.5
const dm = 0.5
const offset = 1
const scale = 0.07

//STATIC
let outline = rectangle(16, 9).strokewidth(0);
let divider1 = line(V2(-8, -0.75), V2(8, -0.75))
let divider2 = line(V2(-8, 3), V2(8, 3))
let tit1 = text("Accelerating coordinate system (with A acceleration)").fontfamily("Math").fontsize(20).position(V2(0, -1))
let tit2 = text("Stationary coordinate system (scaled based on the system's position)").fontfamily("Math").fontsize(20).position(V2(0, 2.75))
let title = text("This interactive is quite complicated. See the 'Things to Notice' section").fontfamily("Math").fontsize(20).position(V2(0, 4.3))
let title2 = text("below for a more detailed explanation,").fontfamily("Math").fontsize(20).position(V2(0, 3.9))
let title3 = text("and an actual example of working with forces and Newton's laws").fontfamily("Math").fontsize(20).position(V2(0, 3.5))

let stat = diagram_combine(divider1, divider2, tit1, tit2, title, title2, title3)

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let m = inp["m"]
    let t = inp["t"]
    let g = inp["g"]
    let mu = inp["mu"]
    let F = inp["F"]

    let M = 10
    let W = m * g
    let Fmax = W * mu

    let A_system = F / (M + m)
    let Freq = m * A_system

    let A
    let a_rel
    let active_f

    if (Freq <= Fmax) {
        A = A_system;
        a_rel = 0;
        active_f = Freq;
    } else {
        A = (F - Fmax) / M;
        let Fp = m * A;
        a_rel = (Fp - Fmax) / m;
        active_f = Fmax;
    }

    let t_col = Infinity;
    if (a_rel > 0) {
        t_col = Math.sqrt((2 * (l + offset)) / a_rel);
    }

    let wall = t >= t_col;
    let current_A = wall ? A_system : A;

    let pos_sys2 = 0;
    if (!wall) {
        pos_sys2 = 0.5 * A * t**2;
    } else {
        let v_col = A * t_col;
        let pos_col = 0.5 * A * t_col**2;
        let dt = t - t_col;
        pos_sys2 = pos_col + v_col * dt + 0.5 * A_system * dt**2;
    }

    let base = polygon([V2(-l, 1), V2(-l, 0), V2(l, 0), V2(l, 1), V2(l + dx, 1), V2(l + dx, -dx), V2(-l - dx, -dx), V2(-l - dx, 1)]).fill("lightgray").strokewidth(0)
    let mass = rectangle(dm * m, 0.4).strokewidth(0).fill("lightblue").move_origin("bottom-left").position(V2(offset, 0)).mut()

    let pos = -0.5 * a_rel * t**2
    if (wall) {
        mass.translate(V2(-l - offset, 0))
    } else {
        mass.translate(V2(pos, 0))
    }

    let annot1 = []
    let c = mass.get_anchor("center-center")

    // Forces for Accelerating Frame
    annot1.push(
        annotation.vector(V2(active_f * scale, 0), "f", V2(0, 0.1), 0.1).position(mass.get_anchor("bottom-center")).stroke("red").fill("red").strokewidth(2),
        annotation.vector(V2(-active_f * scale, 0), "-f", V2(0, 0.1), 0.1).position(base.get_anchor("bottom-center")).stroke("red").fill("red").strokewidth(2)
    )

    if (wall) {
        let Nw = Freq - Fmax;
        annot1.push(
            annotation.vector(V2(Nw * scale, 0), "N'", V2(0, 0.1), 0.1).position(c).stroke("purple").fill("purple").strokewidth(2),
            annotation.vector(V2(-Nw * scale, 0), "-N'", V2(0, 0.1), 0.1).position(base.get_anchor("center-left")).stroke("purple").fill("purple").strokewidth(2)
        )
    }

    annot1.push(
        annotation.vector(V2(-current_A * M * scale, 0), "MA", V2(0, 0.2), 0.1).strokewidth(2).position(base.get_anchor("bottom-left")),
        annotation.vector(V2(0, -W * scale), "W", V2(0.2, 0), 0.1).position(c).stroke("blue").fill("blue").strokewidth(2),
        annotation.vector(V2(0, W * scale), "N", V2(0.2, 0), 0.1).position(c).stroke("blue").fill("blue").strokewidth(2),
        annotation.vector(V2(-m * current_A * scale, 0), "mA", V2(0, 0.1), 0.1).position(c).stroke("cyan").fill("cyan").strokewidth(2),
        annotation.vector(V2(F * scale, 0), "F", V2(0, 0.2), 0.1).strokewidth(2).position(base.get_anchor("bottom-right"))
    )

    //Forces for Stationary Frame
    let annot2 = []
    annot2.push(
        annotation.vector(V2(active_f * scale, 0), "f", V2(0, 0.1), 0.1).position(mass.get_anchor("bottom-center")).stroke("red").fill("red").strokewidth(2),
        annotation.vector(V2(-active_f * scale, 0), "-f", V2(0, 0.1), 0.1).position(base.get_anchor("bottom-center")).stroke("red").fill("red").strokewidth(2),
        annotation.vector(V2(0, -W * scale), "W", V2(0.2, 0), 0.1).position(c).stroke("blue").fill("blue").strokewidth(2),
        annotation.vector(V2(0, W * scale), "N", V2(0.2, 0), 0.1).position(c).stroke("blue").fill("blue").strokewidth(2),
        annotation.vector(V2(F * scale, 0), "F", V2(0, 0.2), 0.1).strokewidth(2).position(base.get_anchor("bottom-right"))
    )

    if (wall) {
        let Nw = Freq - Fmax;
        annot2.push(
            annotation.vector(V2(Nw * scale, 0), "N'", V2(0, 0.1), 0.1).position(c).stroke("purple").fill("purple").strokewidth(2),
            annotation.vector(V2(-Nw * scale, 0), "-N'", V2(0, 0.1), 0.1).position(base.get_anchor("center-left")).stroke("purple").fill("purple").strokewidth(2)
        )
    }

    let sys2 = diagram_combine(base, mass, ...annot2).position(V2(-5.2 + pos_sys2, 0.8))
    let sys1 = diagram_combine(base, mass, ...annot1).position(V2(0, -3))

    draw(outline, stat, sys1)
    draw2(outline.strokewidth(0), sys2, square(0).position(V2(pos_sys2, 0)))
}


int.slider("t", 0, 5, 0, 0.02, 6, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("F", 20, 70, 70, 1, 10, (name, value) => name + " = " + value.toFixed(0) + " N")
int.slider("g", 5, 10, 9.81, 0.01, 10, (name, value) => name + " = " + value.toFixed(2) + " m/s²")
int.slider("mu", 0.3, 0.5, 0.4, 0.01, 10, (name, value) => "μ" + " = " + value.toFixed(2))
int.slider("m", 1, 2, 2, 0.1, 10, (name, value) => "m = " + value.toFixed(1) + " kg")
int.draw()
int.draw()