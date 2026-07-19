import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

let canvas_tex = document.getElementById("tex");

let handletex = (str, conf) => {
    return MathJax.tex2svg(str, conf).innerHTML;
};

let draw_tex = (...diagrams) => {
    draw_to_svg_element(canvas_tex, diagram_combine(...diagrams));
    handle_tex_in_svg(canvas_tex, handletex);
};

let outline = rectangle(16, 9);

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    if (typeof MathJax !== 'undefined' && MathJax.tex2svg) {
        draw_tex(outline)
        //CACHE HERE THE VARIABLES THAT TEX DEPENDS ON
    }

    draw(outline)
}

int.draw()