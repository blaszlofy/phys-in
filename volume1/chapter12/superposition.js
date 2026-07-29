import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, rectangle_corner, V2, arrow1, circle, boolean, square, image, text,
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

let button_off = diagram_combine(square(0.4).strokewidth(0), image("/hide-icon.svg", 0.3, 0.3).move_origin("center-center").position(V2(0, 0)))
let button_on = diagram_combine(square(0.4).strokewidth(0), image("/show-icon.svg", 0.3, 0.3).move_origin("center-center").position(V2(0, 0)))

let xrange = [-8, 8]
let yrange = [-4.5, 2.5]
const x_amount = 16
const y_amount = 7
const G = 0.5
let x_step = (xrange[1] - xrange[0]) / x_amount
let y_step = (yrange[1] - yrange[0]) / y_amount

function generateFieldVectors(mass1_pos, mass2_pos, mass1, mass2, color1, color2) {
    let arrows1 = []
    let arrows2 = []
    let arrows = []
    for (let i = 1; i <= x_amount - 1; i++) {
        for (let j = 1; j <= y_amount - 1; j++) {
            let pos = V2(xrange[0] + i * x_step, yrange[0] + j * y_step)

            let rel1 = mass1_pos.sub(pos)
            if (rel1.length() < 0.7) continue
            let v1 = rel1.scale(G * mass1 / (rel1.length()**3))
            if (mass1 !== 0) {
                arrows1.push(arrow1(pos, pos.add(v1), 0.1).stroke(color1).fill(color1).strokewidth(2).opacity(0.5))
            }
            let rel2 = mass2_pos.sub(pos)
            if (rel2.length() < 0.7) continue
            let v2 = rel2.scale(G * mass2 / (rel2.length()**3))
            if (mass2 !== 0) {
                arrows2.push(arrow1(pos, pos.add(v2), 0.1).stroke(color2).fill(color2).strokewidth(2).opacity(0.5))
            }
            arrows.push(arrow1(pos, pos.add(v1).add(v2), 0.1).strokewidth(2).fill("black"))
        }
    }
    return {a1: arrows1, a2: arrows2, tot: arrows}
}

//STATIC
let outline = rectangle(16, 9).strokewidth(0);

let sq1 = arrow1(V2(0, 0), V2(0.5, 0), 0.1).fill("blue").stroke("blue").strokewidth(2).position(V2(-7, 4.2))
let sq2 = arrow1(V2(0, 0), V2(0.5, 0), 0.1).fill("cyan").stroke("cyan").strokewidth(2).position(V2(-7, 3.7))
let sqtot = arrow1(V2(0, 0), V2(0.5, 0), 0.1).fill("black").stroke("black").strokewidth(2).position(V2(-7, 3.2))
let t1 = text("Value of C₁, the gravitational field from m₁ at a point").fontsize(20).fontfamily("Math").position(V2(-3, 4.2))
let t2 = text("Value of C₂, the gravitational field from m₂ at a point").fontsize(20).fontfamily("Math").position(V2(-3, 3.7))
let ttot = text("Value of C = C₁ + C₂, the total gravitational field at a point").fontsize(20).fontfamily("Math").position(V2(-2.69, 3.2))

let a1 = arrow1(V2(0, 0), V2(0, 0.5), 0.1).fill("blue").stroke("blue").strokewidth(2).position(V2(3, 3.4))
let a2 = arrow1(V2(0, 0), V2(0, 0.5), 0.1).fill("cyan").stroke("cyan").strokewidth(2).position(V2(4, 3.4))
let atot = arrow1(V2(0, 0), V2(0, 0.5), 0.1).fill("black").stroke("black").strokewidth(2).position(V2(5, 3.4))
let plus = text("+").fontsize(20).fontfamily("Math").position(V2(3.5, 3.6))
let equal = text("=").fontsize(20).fontfamily("Math").position(V2(4.5, 3.6))

let leg = diagram_combine(sq1, sq2, sqtot, t1, t2, ttot, a1, a2, atot, plus, equal).translate(V2(0.5, 0))

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let p1 = inp["c1"]
    let p2 = inp["c2"]
    let m1 = inp["m1"]
    let m2 = inp["m2"]
    let show1 = inp["show1"]
    let show2 = inp["show2"]
    let showtot = inp["showtot"]


    let field = generateFieldVectors(p1, p2, m1, m2, "blue", "cyan")
    let field1 = []
    let field2 = []
    let fieldtot = []
    if (show1) {field1 = field.a1}
    if (show2) {field2 = field.a2}
    if (showtot) {fieldtot = field.tot}
    draw(outline, ...field1, ...field2, ...fieldtot, leg)
}

int.slider("m1", 0, 2, 1, 0.2, 10, (name, value) => "m₁" + " = " + value.toFixed(1) + " kg")
int.slider("m2", 0, 2, 1, 0.2, 10, (name, value) => "m₂" + " = " + value.toFixed(1) + " kg")

int.locator("c1", V2(-2.5, -1), 0.2, "blue", null, true, null, {type: "rect", min: V2(xrange[0] + 2 * x_step, yrange[0] + 2 * y_step), max: V2(xrange[1] - 2 * x_step, yrange[1] - 2 * y_step)})
int.locator("c2", V2(2.5, -1), 0.2, "blue", null, true, null, {type: "rect", min: V2(xrange[0] + 2 * x_step, yrange[0] + 2 * y_step), max: V2(xrange[1] - 2 * x_step, yrange[1] - 2 * y_step)})

int.button_toggle("show1", button_on.position(V2(-7, 4.2)), button_off.position(V2(-7, 4.2)), true)
int.button_toggle("show2", button_on.position(V2(-7, 3.7)), button_off.position(V2(-7, 3.7)), true)
int.button_toggle("showtot", button_on.position(V2(-7, 3.2)), button_off.position(V2(-7, 3.2)), true)

int.draw()
int.draw()