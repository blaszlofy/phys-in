import {rectangle, draw_to_svg, diagram_combine, Interactive} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

let outline = rectangle(16, 9);

let int = new Interactive(control, canvas);

int.draw_function((inp) => {
    draw(outline)
})

int.draw()