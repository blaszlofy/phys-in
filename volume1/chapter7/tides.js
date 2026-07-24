import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, V2, polygon, circle, line, xycorneraxes, plotv, regular_polygon, axes_transform, text, square,
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

const ZOOM = 20
const SCALE = 1.1
const DAY_TO_RAW = 86400 / Math.sqrt(1e11)
const zoom_barycenter = V2(4.25, 2)
const barycenter = V2(-3.51, 1.27)
const e = 0.0549
const a = 3.844
const a_vis = a * SCALE

function calcE(M, e, detail) {
    let E = M;
    for (let i = 0; i < detail; i++) {
        let f = E - e * Math.sin(E) - M;
        let f_der = 1 - e * Math.cos(E);
        E = E - (f / f_der);
    }
    return E;
}

function ellipseParameters(focal1, _a, _e, dir = 1) {
    let b = _a * Math.sqrt(1 - Math.pow(_e, 2))
    let u = V2(dir, 0)
    let v = u.rotate(Math.PI / 2).normalize()
    let center = focal1.add(u.scale(_a * _e))
    return {a: _a, b: b, center: center, u: u, v: v};
}

function ellipse(focal1, _a, _e, detail, dir, startE = 0, endE = Math.PI * 2) {
    let params = ellipseParameters(focal1, _a, _e, dir)
    let path = []
    for (let E = startE; E <= endE; E += (endE - startE) / detail) {
        path.push(params.center.add(params.u.scale(params.a * Math.cos(E))).add(params.v.scale(params.b * Math.sin(E))))
    }
    return polygon(path)
}

function tide(theta, h_base) {
    let c = Math.cos(theta)
    return (
        h_base * (3 * Math.pow(c, 2) - 1) / 2
        + h_base * (1 / 60) * (5 * Math.pow(c, 3) - 3 * c) / 2 //1/60 is the ratio of the moons distance from the barycenter to the earth's radius, approximation
    )
}

function get_theta(t, period) {
    let city_angle = 2 * Math.PI * t

    let t_raw = t * DAY_TO_RAW
    let mean_anomaly = 2 * Math.PI * ((t_raw % period) / period)
    let E = calcE(mean_anomaly, e, 5)

    let x = Math.cos(E) - e
    let y = Math.sqrt(1 - Math.pow(e, 2)) * Math.sin(E)
    let moon_angle = Math.atan2(y, x)

    return city_angle - moon_angle
}

//STATIC
let outline = rectangle(16, 11).strokewidth(0);
let divider1 = line(V2(-8, -3), V2(8, -3))
let divider2 = line(V2(0.5, -3), V2(0.5, 5.5))
let div = diagram_combine(divider1, divider2)

let leg_h = text("h - the water height at the red triangle,").fontfamily('Math').fontsize(20).position(V2(4.2, -2.3))
let leg_h2 = text(`a "city" on Earth's surface`).fontfamily('Math').fontsize(20).position(V2(4.2, -2.6))
let leg_t = text("t (days)").fontfamily('Math').fontsize(20).position(V2(7.55, -5.2))
let leg_h3 = text("h (m)").fontfamily('Math').fontsize(20).position(V2(-7.7, -3.4))
let leg = diagram_combine(leg_h, leg_h2, leg_t, leg_h3)

let ax_opt = {
    xrange: [0, 10],
    yrange: [0, 1.7],
    yticks: [0, 1, 2],
    bbox: [V2(-7.3, -5.2), V2(7, -3.1)],
    headsize: 0.1
}

let int = new Interactive(control, canvas);


let graph_points = []
let M_cache, m_cache, G_cache
int.draw_function = (inp) => {
    let M = inp["M"]
    let m = inp["m"] / 100 //Earth: 10^24; Moon: 10^22
    let t = inp["t"] * DAY_TO_RAW
    let G = inp["G"]

    let period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / (G * (m + M)))

    let mean_anomaly = 2 * Math.PI * ((t % period) / period)
    let E = calcE(mean_anomaly, e, 10)

    let earth_params = ellipseParameters(barycenter, a_vis * (m / (m + M)), e)
    let moon_params = ellipseParameters(barycenter, a_vis * (M / (m + M)), e, -1)

    let earth_orbit = ellipse(barycenter, a_vis * (m / (m + M)), e, 100,1).strokewidth(1).stroke("lightgray")
    let moon_orbit = ellipse(barycenter, a_vis * (M / (m + M)), e, 100, -1).strokewidth(1).strokedasharray([10]).stroke("lightgray")

    let R = Math.cbrt(3 * M / (4 * Math.PI * 5515 /*density of the earth*/)) * SCALE
    let r = Math.cbrt(3 * m / (4 * Math.PI * 3344 /*density of the moon*/)) * SCALE

    let earth_pos = earth_params.center.add(earth_params.u.scale(earth_params.a * Math.cos(E))).add(earth_params.v.scale(earth_params.b * Math.sin(E)))
    let moon_pos = moon_params.center.add(moon_params.u.scale(moon_params.a * Math.cos(E))).add(moon_params.v.scale(moon_params.b * Math.sin(E)))

    let earth = circle(R).position(earth_pos).fill("blue").strokewidth(0)
    let moon = circle(r).position(moon_pos).fill("black").strokewidth(0)

    let earth_zoom_params = ellipseParameters(zoom_barycenter, a_vis * (m / (m + M)) * ZOOM, e)
    let earth_zoom_orbit = ellipse(zoom_barycenter, a_vis * (m / (m + M)) * ZOOM, e, 100, 1).strokewidth(1).stroke("lightgray").strokedasharray([10])
    let earth_zoom_pos = earth_zoom_params.center.add(earth_zoom_params.u.scale(earth_zoom_params.a * Math.cos(E))).add(earth_zoom_params.v.scale(earth_zoom_params.b * Math.sin(E)))
    let earth_zoom = circle(R * ZOOM).position(earth_zoom_pos).fill("blue").strokewidth(0)

    let h_base = R * m / M * Math.pow(1 / 60, 3)
    let ax = xycorneraxes(ax_opt).fontsize(20).fontfamily("Math").fill("black").stroke("black").textfill("black")

    let visual_moon_angle = Math.atan2(moon_pos.y - earth_pos.y, moon_pos.x - earth_pos.x)
    //this visual tide is based on absolutly nothing, its just nice
    let visual_tide1 = ellipse(zoom_barycenter, (R * ZOOM) * 1.155, 0.5, 100, 1, -Math.PI / 2, Math.PI / 2).move_origin("center-left").position(earth_zoom_pos).rotate(visual_moon_angle).fill("lightblue").strokewidth(0);
    let visual_tide2 = ellipse(zoom_barycenter, (R * ZOOM) * 1.092, 0.4, 100, -1, -Math.PI / 2, Math.PI / 2).move_origin("center-right").position(earth_zoom_pos).rotate(visual_moon_angle).fill("lightblue").strokewidth(0);
    let visual_tide = diagram_combine(visual_tide1, visual_tide2)

    let city_angle = 2 * Math.PI * t / DAY_TO_RAW + Math.PI / 2 //for visuals
    let city = regular_polygon(3, 0.15).move_origin(V2(0, -R * ZOOM)).position(earth_zoom_pos).rotate(city_angle).strokewidth(0).fill("red")

    if (M_cache !== M || m_cache !== m || G_cache !== G) {
        M_cache = M
        m_cache = m
        G_cache = G
        graph_points = []
        for (let i = 0; i <= 1000; i++) {
            let _t = (i / 1000) * ax_opt.xrange[1];
            let theta = get_theta(_t, period);
            let h = tide(theta, h_base);
            graph_points.push(V2(_t, 0.6 + h / h_base));
        }
    }
    let tide_plot = plotv(graph_points, ax_opt).stroke("lightblue").strokewidth(2)

    let transf = axes_transform(ax_opt)
    let timeline = line(V2((t / DAY_TO_RAW), 0).apply(transf), V2((t / DAY_TO_RAW), ax_opt.yrange[1]).apply(transf)).strokedasharray([10]).stroke("gray")
    let theta = get_theta((t / DAY_TO_RAW), period);
    let h = tide(theta, h_base);
    let value_point = circle(0.05).fill("blue").strokewidth(0).position(V2( (t / DAY_TO_RAW),0.6 + h / h_base).apply(transf))

    let plot_vis = diagram_combine(timeline, value_point)

    let h_value = text("h = " + (0.6 + h / h_base).toFixed(2)).fontfamily('Math').fontsize(20).position(V2(4.2, -2))

    draw(outline, div, earth_orbit, moon_orbit, earth, moon, visual_tide, city, earth_zoom_orbit, earth_zoom, ax, tide_plot, (t / DAY_TO_RAW < ax_opt.xrange[1] ? plot_vis : square(0)), leg, h_value)
}

int.slider("t", 0, 30, 0, 0.01, 60, (name, value) => name + " = " + value.toFixed(2) + " days")
int.slider("M", 5, 7, 5.97, 0.01, 10, (name, value) => name + " = " + value.toFixed(2) + " ⋅ 10²⁴ kg")
int.slider("m", 5, 9, 7.34, 0.01, 10, (name, value) => name + " = " + value.toFixed(2) + " ⋅ 10²² kg ")
int.slider("G", 6, 8, 6.67, 0.01, 10, (name, value) => name + " = " + value.toFixed(2) + " ⋅ 10⁻¹¹ m³/kg⋅s²")

int.draw()
int.draw()